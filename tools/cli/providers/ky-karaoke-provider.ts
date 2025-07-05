import * as cheerio from 'cheerio';
import { KaraokeProvider, KaraokeResult } from '../types/search-types.js';
import { safeFetch } from '../utils/fetch-utils.js';
import { Logger } from '../utils/logger.js';

export class KYKaraokeProvider implements KaraokeProvider {
  name = 'KY Karaoke';
  
  constructor(private logger: Logger) {}

  async search(query: string): Promise<KaraokeResult[]> {
    this.logger.log(`Searching KY Karaoke for: ${query}`);
    let results: KaraokeResult[] = [];
    
    try {
      // Use the working KY singing website
      // category=2: song search (based on the URL pattern)
      // s_page=1: first page of results
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://kysing.kr/search/?category=2&keyword=${encodedQuery}&s_page=1`;
      
      this.logger.log(`KY search URL: ${searchUrl}`);
      
      const response = await safeFetch(searchUrl);
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Parse KY search results - look for actual song entries
        // Filter out navigation and UI elements
        const songElements = $('*').filter((_, elem) => {
          const text = $(elem).text().trim();
          const hasNumber = /\d{5,6}/.test(text);
          const isNavigation = text.includes('콘텐츠로') || text.includes('고객센터') || 
                             text.includes('메뉴') || text.includes('검색') ||
                             text.includes('로그인') || text.includes('회원가입') ||
                             text.length < 5;
          
          return hasNumber && !isNavigation && text.length > 10;
        });
        
        const processedIds = new Set<string>();
        
        songElements.each((_, elem) => {
          const $elem = $(elem);
          const fullText = $elem.text().trim();
          
          // Skip if this contains multiple song numbers (likely a parent element)
          const numberMatches = fullText.match(/\d{5,6}/g);
          if (!numberMatches || numberMatches.length > 1) return;
          
          // Look for KY song number pattern (usually 5-6 digits)
          const idMatch = fullText.match(/(\d{5,6})/);
          if (!idMatch) return;
          
          const id = idMatch[1];
          if (processedIds.has(id)) return;
          
          // Extract title and artist - remove the ID first
          let remainingText = fullText.replace(id, '').trim();
          
          // Clean up common prefixes/suffixes
          remainingText = remainingText.replace(/^[-\s]+|[\s]+$/g, '');
          
          // Try different splitting patterns for KY format
          let title = '';
          let artist = '';
          
          // Pattern 1: "Title - Artist" or "Title Artist"
          if (remainingText.includes(' - ')) {
            const parts = remainingText.split(' - ');
            title = parts[0].trim();
            artist = parts[1] ? parts[1].trim() : '';
          } else if (remainingText.includes('  ')) {
            // Pattern 2: "Title  Artist" (double space)
            const parts = remainingText.split(/\s{2,}/);
            title = parts[0].trim();
            artist = parts[1] ? parts[1].trim() : '';
          } else {
            // Pattern 3: Just take the remaining text as title
            const words = remainingText.split(/\s+/);
            if (words.length >= 2) {
              title = words[0];
              artist = words.slice(1).join(' ');
            } else {
              title = remainingText;
            }
          }
          
          // Validate the extracted data
          if (title && title.length > 0 && 
              !title.includes('KYSing') && 
              !title.includes('고객') &&
              !title.includes('센터') &&
              !/^\d+$/.test(title)) {
            
            processedIds.add(id);
            results.push({
              id,
              title,
              artist: artist || undefined,
              source: 'KY'
            });
          }
        });
        
        // Deduplicate results
        results = results.reduce((acc, curr) => {
          const exists = acc.find(r => r.id === curr.id);
          if (!exists) acc.push(curr);
          return acc;
        }, [] as KaraokeResult[]);
      }
      
      this.logger.log(`Found ${results.length} results from KY Karaoke`);
    } catch (error) {
      this.logger.log(`Error searching KY Karaoke: ${error}`);
      this.logger.error('Failed to search KY Karaoke');
    }
    
    return results;
  }
} 
