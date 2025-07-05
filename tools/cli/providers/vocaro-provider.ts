import * as cheerio from 'cheerio';
import { LyricsProvider, LyricsResult } from '../types/search-types.js';
import { safeFetch } from '../utils/fetch-utils.js';
import { Logger } from '../utils/logger.js';
import { GoogleSearchService } from '../utils/google-search.js';

export class VocaroProvider implements LyricsProvider {
  name = 'Vocaro Wiki';
  private googleSearch: GoogleSearchService;
  
  constructor(private logger: Logger) {
    this.googleSearch = new GoogleSearchService(logger);
  }

  async search(query: string): Promise<LyricsResult[]> {
    this.logger.log(`Searching Vocaro Wiki for: ${query}`);
    let results: LyricsResult[] = [];
    
    try {
      // Step 1: Try the direct Vocaro Wiki search first
      results = await this.directVocaroSearch(query);
      
      // Step 2: If direct search fails or returns few results, use Bing search as fallback
      if (results.length < 3) {
        this.logger.log(`Direct search returned ${results.length} results, trying Bing search as fallback`);
        const googleResults = await this.googleSearchFallback(query);
        
        // Merge results, avoiding duplicates
        const existingUrls = new Set(results.map(r => r.url));
        const newResults = googleResults.filter(r => !existingUrls.has(r.url));
        results = [...results, ...newResults];
      }
      
      // Step 3: If we still have few results, try direct URL construction
      if (results.length < 2) {
        this.logger.log(`Still few results (${results.length}), trying direct URL construction`);
        const directResults = await this.tryDirectUrls(query);
        
        // Merge with existing results, avoiding duplicates
        const existingUrls = new Set(results.map(r => r.url));
        const newDirectResults = directResults.filter((r: LyricsResult) => !existingUrls.has(r.url));
        results = [...results, ...newDirectResults];
      }
      
      // Step 4: Investigate top 5 results to validate and enhance them
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
      this.logger.log(`Performing Bing search for "${query}" on vocaro.wikidot.com`);
      
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
      
      this.logger.log(`Found ${results.length} results from Bing search fallback`);
      return results;
      
    } catch (error) {
      this.logger.log(`Error in Bing search fallback: ${error}`);
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
} 
