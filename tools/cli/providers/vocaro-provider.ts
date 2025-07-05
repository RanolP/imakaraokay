import * as cheerio from 'cheerio';
import { LyricsProvider, LyricsResult, KaraokeResult } from '../types/search-types.js';
import { safeFetch } from '../utils/fetch-utils.js';
import { Logger } from '../utils/logger.js';
import { GoogleSearchService } from '../utils/google-search.js';

// Import TJ and KY providers for cross-search functionality
import { TJKaraokeProvider } from './tj-karaoke-provider.js';
import { KYKaraokeProvider } from './ky-karaoke-provider.js';

export interface EnhancedLyricsResult extends LyricsResult {
  japaneseTitle?: string;
  karaokeResults?: KaraokeResult[];
  lyrics?: string;
}

export class VocaroProvider implements LyricsProvider {
  name = 'Vocaro Wiki';
  private googleSearch: GoogleSearchService;
  private tjProvider: TJKaraokeProvider;
  private kyProvider: KYKaraokeProvider;
  
  constructor(private logger: Logger) {
    this.googleSearch = new GoogleSearchService(logger);
    this.tjProvider = new TJKaraokeProvider(logger);
    this.kyProvider = new KYKaraokeProvider(logger);
  }

  async search(query: string): Promise<LyricsResult[]> {
    this.logger.log(`Searching Vocaro Wiki for: ${query}`);
    let results: LyricsResult[] = [];
    
    try {
      // Step 1: Try the direct Vocaro Wiki search first
      results = await this.directVocaroSearch(query);
      
      // Step 2: Check if query contains Korean and if we have exact matches
      if (this.containsKorean(query) && results.length > 0) {
        this.logger.log('Korean query detected with Vocaro results, attempting Japanese title extraction and karaoke search');
        results = await this.enhanceWithKaraokeSearch(results, query);
      }
      
      // Step 3: If direct search fails or returns few results, use Google search as fallback
      if (results.length < 3) {
        this.logger.log(`Direct search returned ${results.length} results, trying Google search as fallback`);
        const googleResults = await this.googleSearchFallback(query);
        
        // Merge results, avoiding duplicates
        const existingUrls = new Set(results.map(r => r.url));
        const newResults = googleResults.filter(r => !existingUrls.has(r.url));
        results = [...results, ...newResults];
      }
      
      // Step 4: If we still have few results, try direct URL construction
      if (results.length < 2) {
        this.logger.log(`Still few results (${results.length}), trying direct URL construction`);
        const directResults = await this.tryDirectUrls(query);
        
        // Merge with existing results, avoiding duplicates
        const existingUrls = new Set(results.map(r => r.url));
        const newDirectResults = directResults.filter((r: LyricsResult) => !existingUrls.has(r.url));
        results = [...results, ...newDirectResults];
      }
      
      // Step 5: Investigate top 5 results to validate and enhance them
      const topResults = results.slice(0, 5);
      const investigatedResults = await this.investigateResults(topResults);
      
      this.logger.log(`Final result: ${investigatedResults.length} validated results from Vocaro Wiki`);
      return investigatedResults;
      
    } catch (error) {
      this.logger.log(`Error searching Vocaro Wiki: ${error}`);
      this.logger.error('Failed to search Vocaro Wiki');
      return results.slice(0, 5);
    }
  }

  private async directVocaroSearch(query: string): Promise<LyricsResult[]> {
    const results: LyricsResult[] = [];
    
    try {
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `http://vocaro.wikidot.com/search:site/q/${encodedQuery}`;
      
      const response = await safeFetch(searchUrl);
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Parse search results
        $('.search-results .w-item, .list-pages-item').each((index, item) => {
          if (index >= 5) return;
          
          const $item = $(item);
          const titleLink = $item.find('.title a, h1 a, a').first();
          const title = titleLink.text().trim() || $item.find('.w-title').text().trim();
          const href = titleLink.attr('href');
          
          if (title && href) {
            results.push({
              title,
              url: href.startsWith('http') ? href : `http://vocaro.wikidot.com${href}`,
              source: 'Vocaro'
            });
          }
        });
        
        // If no results, try alternative selectors
        if (results.length === 0) {
          $('a[href^="/"], a[href*="vocaro"]').each((index, elem) => {
            if (index >= 10) return;
            
            const $elem = $(elem);
            const href = $elem.attr('href');
            const text = $elem.text().trim();
            
            // Filter out navigation links
            if (href && text && text.length > 3 && 
                !href.includes('/forum/') && 
                !href.includes('/system:') &&
                !text.includes('전체') &&
                !text.includes('목록')) {
              results.push({
                title: text,
                url: href.startsWith('http') ? href : `http://vocaro.wikidot.com${href}`,
                source: 'Vocaro'
              });
            }
          });
        }
      }
      
      this.logger.log(`Found ${results.length} results from direct Vocaro search`);
    } catch (error) {
      this.logger.log(`Error in direct Vocaro search: ${error}`);
    }
    
    return results;
  }

  private async googleSearchFallback(query: string): Promise<LyricsResult[]> {
    try {
      this.logger.log(`Performing Google search for "${query}" on vocaro.wikidot.com`);
      
      const googleResults = await this.googleSearch.searchWithDomainFilter(
        query, 
        'vocaro.wikidot.com', 
        5
      );
      
      const results: LyricsResult[] = googleResults.map(result => ({
        title: result.title,
        url: result.url,
        source: 'Vocaro' as const,
        artist: undefined // Will be filled in during investigation
      }));
      
      this.logger.log(`Found ${results.length} results from Google search fallback`);
      return results;
      
    } catch (error) {
      this.logger.log(`Error in Google search fallback: ${error}`);
      return [];
    }
  }

  private async investigateResults(results: LyricsResult[]): Promise<LyricsResult[]> {
    this.logger.log(`Investigating ${results.length} results...`);
    
    const investigatedResults: LyricsResult[] = [];
    
    // Investigate each result in parallel for better performance
    const investigations = results.map(async (result) => {
      try {
        const investigation = await this.googleSearch.investigateUrl(result.url);
        
        // Only include results that appear to be valid song/lyrics pages
        if (investigation.isValid) {
          return {
            ...result,
            title: investigation.songTitle || investigation.title || result.title,
            artist: investigation.artist || result.artist,
            // Add additional metadata if found
            ...(investigation.lyrics && { lyrics: investigation.lyrics.substring(0, 200) + '...' })
          };
        }
        
        return null;
      } catch (error) {
        this.logger.log(`Failed to investigate ${result.url}: ${error}`);
        // Return original result if investigation fails
        return result;
      }
    });
    
    const investigationResults = await Promise.all(investigations);
    
    // Filter out null results and add valid ones
    for (const result of investigationResults) {
      if (result) {
        investigatedResults.push(result);
      }
    }
    
    this.logger.log(`Investigation complete: ${investigatedResults.length} valid results found`);
    return investigatedResults;
  }

  private async tryDirectUrls(query: string): Promise<LyricsResult[]> {
    this.logger.log(`Trying direct URL construction for query: ${query}`);
    const results: LyricsResult[] = [];
    
    // Common URL patterns for vocaro.wikidot.com based on observed patterns
    const urlPatterns = [
      `http://vocaro.wikidot.com/${query.toLowerCase()}`,
      `http://vocaro.wikidot.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
      `http://vocaro.wikidot.com/${query.toLowerCase().replace(/\s+/g, '')}`,
    ];
    
    // Try each pattern
    for (const url of urlPatterns) {
      try {
        this.logger.log(`Trying direct URL: ${url}`);
        const investigation = await this.googleSearch.investigateUrl(url);
        
        if (investigation.isValid) {
          results.push({
            title: investigation.songTitle || investigation.title || query,
            url: url,
            source: 'Vocaro' as const,
            artist: investigation.artist,
          });
          this.logger.log(`Direct URL success: ${url}`);
          break; // Found a working URL, no need to try others
        }
      } catch (error) {
        this.logger.log(`Direct URL failed: ${url} - ${error}`);
      }
    }
    
    this.logger.log(`Direct URL construction found ${results.length} results`);
    return results;
  }

  /**
   * Detects if the query contains Korean characters
   */
  private containsKorean(text: string): boolean {
    // Korean Unicode ranges: Hangul Syllables (AC00-D7AF), Hangul Jamo (1100-11FF), Hangul Compatibility Jamo (3130-318F)
    const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
    return koreanRegex.test(text);
  }

  /**
   * Detects if text contains Japanese characters
   */
  private containsJapanese(text: string): boolean {
    // Japanese Unicode ranges: Hiragana (3040-309F), Katakana (30A0-30FF), Kanji (4E00-9FAF)
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    return japaneseRegex.test(text);
  }

  /**
   * Enhances Vocaro results by extracting Japanese titles and searching karaoke providers
   */
  private async enhanceWithKaraokeSearch(results: LyricsResult[], originalQuery: string): Promise<LyricsResult[]> {
    const enhancedResults: LyricsResult[] = [];
    
    for (const result of results) {
      try {
        // Fetch the Vocaro Wiki page content
        const pageContent = await this.fetchVocaroPageContent(result.url);
        const japaneseTitle = this.extractJapaneseTitle(pageContent, originalQuery);
        
        if (japaneseTitle) {
          this.logger.log(`Extracted Japanese title: ${japaneseTitle} from ${result.url}`);
          
          // Search TJ and KY providers with the Japanese title
          const karaokeResults = await this.searchKaraokeProviders(japaneseTitle);
          
          // Create enhanced result
          const enhancedResult: EnhancedLyricsResult = {
            ...result,
            japaneseTitle,
            karaokeResults
          };
          
          // Add karaoke results as additional context in the title
          if (karaokeResults.length > 0) {
            enhancedResult.title = `${result.title} (JP: ${japaneseTitle}) [${karaokeResults.length} karaoke matches]`;
          }
          
          enhancedResults.push(enhancedResult);
        } else {
          // No Japanese title found, keep original result
          enhancedResults.push(result);
        }
      } catch (error) {
        this.logger.log(`Failed to enhance result ${result.url}: ${error}`);
        // Keep original result if enhancement fails
        enhancedResults.push(result);
      }
    }
    
    return enhancedResults;
  }

  /**
   * Fetches the content of a Vocaro Wiki page
   */
  private async fetchVocaroPageContent(url: string): Promise<string> {
    const response = await safeFetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  }

  /**
   * Extracts Japanese title from Vocaro Wiki page content
   */
  private extractJapaneseTitle(html: string, originalQuery: string): string | null {
    const $ = cheerio.load(html);
    
    // Common patterns for Japanese titles on Vocaro Wiki
    const titleSelectors = [
      'h1', 'h2', 'h3',
      '.page-title',
      '#page-title',
      '.title',
      '.song-title'
    ];
    
    // Look for Japanese text in various elements
    for (const selector of titleSelectors) {
      const elements = $(selector);
      
      for (let i = 0; i < elements.length; i++) {
        const text = $(elements[i]).text().trim();
        
        // Check if this text contains Japanese and is different from the original Korean query
        if (this.containsJapanese(text) && text !== originalQuery && text.length > 1) {
          // Additional validation: ensure it's likely a song title
          if (this.isLikelySongTitle(text)) {
            return text;
          }
        }
      }
    }
    
    // Fallback: look for Japanese text in paragraphs or divs
    const contentElements = $('p, div, span').filter((_, elem) => {
      const text = $(elem).text().trim();
      return this.containsJapanese(text) && 
             text.length > 1 && 
             text.length < 100 && // Reasonable title length
             text !== originalQuery;
    });
    
    if (contentElements.length > 0) {
      const text = $(contentElements[0]).text().trim();
      if (this.isLikelySongTitle(text)) {
        return text;
      }
    }
    
    return null;
  }

  /**
   * Validates if text is likely a song title
   */
  private isLikelySongTitle(text: string): boolean {
    // Exclude common non-title patterns
    const excludePatterns = [
      /^(작성자|작성일|수정|편집|삭제|목록|검색|메뉴)/,
      /^(http|www\.)/,
      /^\d+$/,
      /^(다음|이전|홈|뒤로)/,
      /(로그인|회원가입|비밀번호)/
    ];
    
    for (const pattern of excludePatterns) {
      if (pattern.test(text)) {
        return false;
      }
    }
    
    // Should be reasonable length for a song title
    return text.length >= 2 && text.length <= 50;
  }

  /**
   * Searches both TJ and KY karaoke providers with the given query
   */
  private async searchKaraokeProviders(query: string): Promise<KaraokeResult[]> {
    try {
      this.logger.log(`Searching karaoke providers for Japanese title: ${query}`);
      
      // Search both providers in parallel
      const [tjResults, kyResults] = await Promise.all([
        this.tjProvider.search(query).catch(error => {
          this.logger.log(`TJ search failed: ${error}`);
          return [];
        }),
        this.kyProvider.search(query).catch(error => {
          this.logger.log(`KY search failed: ${error}`);
          return [];
        })
      ]);
      
      const allResults = [...tjResults, ...kyResults];
      this.logger.log(`Found ${allResults.length} karaoke results (TJ: ${tjResults.length}, KY: ${kyResults.length})`);
      
      return allResults;
    } catch (error) {
      this.logger.log(`Error searching karaoke providers: ${error}`);
      return [];
    }
  }
} 
