import * as cheerio from 'cheerio';
import { LyricsProvider, LyricsResult } from '../types/search-types.js';
import { safeFetch } from '../utils/fetch-utils.js';
import { Logger } from '../utils/logger.js';

export class VocaroProvider implements LyricsProvider {
  name = 'Vocaro Wiki';
  
  constructor(private logger: Logger) {}

  async search(query: string): Promise<LyricsResult[]> {
    this.logger.log(`Searching Vocaro Wiki for: ${query}`);
    const results: LyricsResult[] = [];
    
    try {
      // Try the main page search first
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
      
      this.logger.log(`Found ${results.length} results from Vocaro Wiki`);
    } catch (error) {
      this.logger.log(`Error searching Vocaro Wiki: ${error}`);
      this.logger.error('Failed to search Vocaro Wiki');
    }
    
    return results.slice(0, 5);
  }
} 
