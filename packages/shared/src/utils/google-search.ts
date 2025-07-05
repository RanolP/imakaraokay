import { search, ResultTypes } from 'google-sr';
import { safeFetch } from './fetch-utils.js';
import * as cheerio from 'cheerio';
import { Logger } from './logger.js';

export interface GoogleSearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

export class GoogleSearchService {
  constructor(private logger: Logger) {}

  /**
   * Search Google with domain filtering using google-sr library
   * @param query The search query
   * @param domain The domain to filter results to (e.g., 'vocaro.wikidot.com')
   * @param maxResults Maximum number of results to return (default: 5)
   */
  async searchWithDomainFilter(
    query: string, 
    domain: string, 
    maxResults: number = 5
  ): Promise<GoogleSearchResult[]> {
    this.logger.log(`Searching Google for "${query}" on domain ${domain}`);
    
    const results: GoogleSearchResult[] = [];
    
    try {
      // Construct search query with site: operator for domain filtering
      const searchQuery = `${query} site:${domain}`;
      
      this.logger.log(`Google search query: ${searchQuery}`);
      
            // Use google-sr to search
      const searchResults = await search({
        query: searchQuery,
      });
      
      this.logger.log(`Found ${searchResults.length} total search results`);
      
      // Filter and process results
      let validResults = 0;
      for (const result of searchResults) {
        if (validResults >= maxResults) break;
        
        if (result.type === ResultTypes.OrganicResult) {
          const organicResult = result as any;
          
          // Verify the URL is from the target domain
          if (organicResult.link && organicResult.link.includes(domain)) {
            results.push({
              title: organicResult.title || 'No title',
              url: organicResult.link,
              snippet: organicResult.description || 'No description available',
              domain: domain
            });
            validResults++;
          }
        }
      }
      
      this.logger.log(`Found ${results.length} Google search results for domain ${domain}`);
      
    } catch (error) {
      this.logger.log(`Error performing Google search: ${error}`);
      throw error;
    }
    
    return results.slice(0, maxResults);
  }

  /**
   * Investigate a URL by fetching its content and extracting key information
   */
  async investigateUrl(url: string): Promise<{
    title: string;
    content: string;
    lyrics?: string;
    artist?: string;
    songTitle?: string;
    isValid: boolean;
  }> {
    this.logger.log(`Investigating URL: ${url}`);
    
    try {
      const response = await safeFetch(url);
      
      if (!response.ok) {
        return {
          title: 'Failed to load',
          content: `HTTP ${response.status}`,
          isValid: false
        };
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract title
      const title = $('title').text().trim() || 
                   $('h1').first().text().trim() || 
                   'No title found';
      
      // Extract main content
      let content = '';
      
      // Try to find the main content area
      const contentSelectors = [
        '#main-content',
        '.content',
        '#content',
        '.page-content',
        '.main',
        'main',
        'article'
      ];
      
      for (const selector of contentSelectors) {
        const $content = $(selector);
        if ($content.length) {
          content = $content.text().trim();
          break;
        }
      }
      
      // If no main content found, get body text but filter out navigation
      if (!content) {
        $('script, style, nav, header, footer, .nav, .menu').remove();
        content = $('body').text().trim();
      }
      
      // Clean up content (remove excessive whitespace)
      content = content.replace(/\s+/g, ' ').trim();
      
      // Try to extract lyrics-specific information
      let lyrics = '';
      let artist = '';
      let songTitle = '';
      
      // Look for lyrics patterns
      const lyricsSelectors = [
        '.lyrics',
        '#lyrics',
        '.song-lyrics',
        '.lyric-content',
        '.verse'
      ];
      
      for (const selector of lyricsSelectors) {
        const $lyrics = $(selector);
        if ($lyrics.length) {
          lyrics = $lyrics.text().trim();
          break;
        }
      }
      
      // Try to extract artist and song info from title or content
      const titleLower = title.toLowerCase();
      if (titleLower.includes(' - ')) {
        const parts = title.split(' - ');
        if (parts.length >= 2) {
          songTitle = parts[0].trim();
          artist = parts[1].trim();
        }
      }
      
      // Check if this looks like a valid song/lyrics page
      const isValid = lyrics.length > 50 || 
                     content.toLowerCase().includes('lyrics') ||
                     content.toLowerCase().includes('가사') ||
                     title.toLowerCase().includes('lyrics') ||
                     title.toLowerCase().includes('가사');
      
      return {
        title,
        content: content.substring(0, 1000), // Limit content length
        lyrics: lyrics || undefined,
        artist: artist || undefined,
        songTitle: songTitle || undefined,
        isValid
      };
      
    } catch (error) {
      this.logger.log(`Error investigating URL ${url}: ${error}`);
      return {
        title: 'Investigation failed',
        content: `Error: ${error}`,
        isValid: false
      };
    }
  }
} 
