import * as cheerio from 'cheerio';
import { KaraokeProvider, KaraokeResult } from '../types/search-types.js';
import { safeFetch } from '../utils/fetch-utils.js';
import { Logger } from '../utils/logger.js';

export class TJKaraokeProvider implements KaraokeProvider {
  name = 'TJ Karaoke';
  
  constructor(private logger: Logger) {}

  async search(query: string): Promise<KaraokeResult[]> {
    this.logger.log(`Searching TJ Karaoke for: ${query}`);
    let results: KaraokeResult[] = [];
    
    try {
      // Use the working TJ Media website with full parameters
      // strType=1: song title search mode
      // pageRowCnt=50: get up to 50 results
      // strSotrGubun=ASC: ascending sort order
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://www.tjmedia.com/song/accompaniment_search?pageNo=1&pageRowCnt=50&strSotrGubun=ASC&strSortType=&nationType=&strType=1&searchTxt=${encodedQuery}`;
      
      this.logger.log(`TJ search URL: ${searchUrl}`);
      
      const response = await safeFetch(searchUrl);
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Parse the song results from the TJ Media website
        // Looking for structure like: 곡번호24518 MV Blueming IU 아이유 이종훈,이채규,아이유
        
        // Find all elements containing song numbers
        const songElements = $('li, tr, div').filter((_, elem) => {
          const text = $(elem).text();
          return text.includes('곡번호') && /곡번호\d+/.test(text);
        });
        
        const processedIds = new Set<string>();
        
        songElements.each((_, elem) => {
          const $elem = $(elem);
          const fullText = $elem.text().trim();
          
          // Skip if this is a parent element containing already processed songs
          const songNumMatches = fullText.match(/곡번호(\d+)/g);
          if (songNumMatches && songNumMatches.length > 1) {
            return; // Skip parent elements containing multiple songs
          }
          
          // Extract song number
          const idMatch = fullText.match(/곡번호(\d+)/);
          if (!idMatch) return;
          
          const id = idMatch[1];
          if (processedIds.has(id)) return;
          
          // Find the song title and artist
          // The structure after 곡번호 can be: MV/MR Title Artist KoreanArtist Composers
          let remainingText = fullText.substring(fullText.indexOf(id) + id.length).trim();
          
          // Clean up MV/MR markers
          remainingText = remainingText.replace(/\s*(MV|MR)\s*/g, ' ').trim();
          
          // Split by whitespace and filter empty strings
          const parts = remainingText.split(/\s+/).filter(p => p.length > 0);
          
          if (parts.length >= 2) {
            // First non-MV/MR part is the title
            const title = parts[0];
            
            // Second part is usually the artist (English name)
            const artist = parts[1];
            
            // Check if this looks like a valid result
            if (title && artist && !title.includes('곡') && !artist.includes('작')) {
              processedIds.add(id);
              results.push({
                id,
                title,
                artist,
                source: 'TJ'
              });
            }
          }
        });
        
        // Limit results to avoid duplicates
        results = results.reduce((acc, curr) => {
          const exists = acc.find(r => r.id === curr.id);
          if (!exists) acc.push(curr);
          return acc;
        }, [] as KaraokeResult[]);
      }
      
      this.logger.log(`Found ${results.length} results from TJ Karaoke`);
    } catch (error) {
      this.logger.log(`Error searching TJ Karaoke: ${error}`);
      this.logger.error('Failed to search TJ Karaoke');
    }
    
    return results;
  }
} 
