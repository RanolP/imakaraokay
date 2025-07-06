import * as cheerio from 'cheerio';
import type { LyricsProvider, LyricsResult } from '../types/search-types.js';
import { safeFetch } from '../utils/fetch-utils.js';
import type { Logger } from '../utils/logger.js';

export class MusixMatchProvider implements LyricsProvider {
  name = 'MusixMatch';

  constructor(private logger: Logger) {}

  async search(query: string): Promise<LyricsResult[]> {
    this.logger.log(`Searching MusixMatch for: ${query}`);
    const results: LyricsResult[] = [];

    try {
      const encodedQuery = encodeURIComponent(query);
      const searchUrl = `https://www.musixmatch.com/search/${encodedQuery}/tracks`;

      const response = await safeFetch(searchUrl);

      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);

        // Try multiple selectors
        $('.track-list__item, .media-card, .track-card').each((index, elem) => {
          if (index >= 5) return; // Limit to 5 results

          const titleElem = $(elem).find('.track-name, .title, h2');
          const artistElem = $(elem).find('.artist-name, .artist, h3');
          const linkElem = $(elem).find('a[href*="/lyrics/"]').first();

          const title = titleElem.text().trim();
          const artist = artistElem.text().trim();
          const href = linkElem.attr('href');

          if (title && href) {
            results.push({
              title,
              artist: artist || undefined,
              url: href.startsWith('http') ? href : `https://www.musixmatch.com${href}`,
              source: 'MusixMatch',
            });
          }
        });

        // If no results found with specific selectors, try a more general approach
        if (results.length === 0) {
          $('a[href*="/lyrics/"]').each((index, elem) => {
            if (index >= 5) return;

            const $elem = $(elem);
            const href = $elem.attr('href');
            const text = $elem.text().trim();

            if (href && text && text.length > 0) {
              results.push({
                title: text,
                url: `https://www.musixmatch.com${href}`,
                source: 'MusixMatch',
              });
            }
          });
        }
      }

      this.logger.log(`Found ${results.length} results from MusixMatch`);
    } catch (error) {
      this.logger.log(`Error searching MusixMatch: ${error}`);
      this.logger.error('Failed to search MusixMatch');
    }

    return results.slice(0, 5);
  }
}
