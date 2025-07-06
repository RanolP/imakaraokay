import * as cheerio from 'cheerio';
import type { KaraokeProvider, KaraokeResult } from '../types/search-types.js';
import { safeFetch } from '../utils/fetch-utils.js';
import type { Logger } from '../utils/logger.js';

export class KYKaraokeProvider implements KaraokeProvider {
  name = 'KY Karaoke';

  constructor(private logger: Logger) {}

  async search(query: string): Promise<KaraokeResult[]> {
    this.logger.log(`Searching KY Karaoke for: ${query}`);
    const results: KaraokeResult[] = [];

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

        // Parse KY search results using the correct structure
        // Each song is in a ul.search_chart_list element
        const songLists = $('ul.search_chart_list');

        songLists.each((_, songList) => {
          const $songList = $(songList);

          try {
            // Extract song number from li.search_chart_num
            const songNumElem = $songList.find('li.search_chart_num');
            const id = songNumElem.text().trim();

            if (!id || !/^\d+$/.test(id)) return; // Skip if no valid song number

            // Extract title from li.search_chart_tit span.tit (first span, not mo-art)
            const titleElem = $songList.find('li.search_chart_tit span.tit:not(.mo-art)');
            const title = titleElem.text().trim();

            // Extract artist from li.search_chart_sng
            const artistElem = $songList.find('li.search_chart_sng');
            const artist = artistElem.text().trim();

            // Validate the extracted data
            if (title && title.length > 0 && this.isValidKYResult(title, artist, id)) {
              results.push({
                id,
                title,
                artist: artist || undefined,
                source: 'KY',
              });
            }
          } catch (error) {
            this.logger.log(`Error parsing song list: ${error}`);
          }
        });

        // Remove duplicates based on ID
        const uniqueResults = results.reduce((acc, curr) => {
          const exists = acc.find((r) => r.id === curr.id);
          if (!exists) acc.push(curr);
          return acc;
        }, [] as KaraokeResult[]);

        results.length = 0;
        results.push(...uniqueResults);
      }

      this.logger.log(`Found ${results.length} results from KY Karaoke`);
    } catch (error) {
      this.logger.log(`Error searching KY Karaoke: ${error}`);
      this.logger.error('Failed to search KY Karaoke');
    }

    return results;
  }

  private isValidKYResult(title: string, artist: string, id: string): boolean {
    return (
      title.length > 0 &&
      !title.includes('KYSing') &&
      !title.includes('고객') &&
      !title.includes('센터') &&
      !title.includes('키싱') &&
      !/^\d+$/.test(title) &&
      id.length >= 4 &&
      (!artist || artist.length > 0)
    ); // Validate artist if provided
  }
}
