import * as cheerio from 'cheerio';
import { KaraokeProvider, KaraokeResult } from '../types/search-types.js';
import { safeFetch } from '../utils/fetch-utils.js';
import { Logger } from '../utils/logger.js';

export class TJKaraokeProvider implements KaraokeProvider {
  name = 'TJ Karaoke';

  constructor(private logger: Logger) {}

  async search(query: string): Promise<KaraokeResult[]> {
    this.logger.log(`Searching TJ Karaoke for: ${query}`);
    const results: KaraokeResult[] = [];

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

        // Parse the song results using the proper structure
        // Each song is in a ul.grid-container.list.ico element
        const songContainers = $('ul.grid-container.list.ico');

        songContainers.each((_, container) => {
          const $container = $(container);

          try {
            // Extract song number from li.grid-item.center.pos-type .num2
            const songNumberElem = $container.find('li.grid-item.center.pos-type .num2');
            const id = songNumberElem.text().trim();

            if (!id) return; // Skip if no song number found

            // Extract title from li.grid-item.title3 p span - try nested span first, then direct span
            let titleElem = $container.find('li.grid-item.title3 p > span');
            const title = titleElem.text().trim();

            // Extract artist from li.grid-item.title4.singer p span
            const artistElem = $container.find('li.grid-item.title4.singer p span');
            const artist = artistElem.text().trim();

            // Validate the extracted data
            if (title && title.length > 0) {
              results.push({
                id,
                title,
                artist: artist || undefined,
                source: 'TJ',
              });
            }
          } catch (error) {
            this.logger.log(`Error parsing song container: ${error}`);
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

      this.logger.log(`Found ${results.length} results from TJ Karaoke`);
    } catch (error) {
      this.logger.log(`Error searching TJ Karaoke: ${error}`);
      this.logger.error('Failed to search TJ Karaoke');
    }

    return results;
  }
}
