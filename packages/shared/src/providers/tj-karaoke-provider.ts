import { searchTJ } from '@imakaraokay/utaitai';
import type { KaraokeProvider, KaraokeResult } from '../types/search-types.js';
import { tjResponseToKaraokeResult } from '../types/search-types.js';
import type { Logger } from '../utils/logger.js';

export class TJKaraokeProvider implements KaraokeProvider {
  name = 'TJ Karaoke';

  constructor(private logger: Logger) { }

  async search(query: string): Promise<KaraokeResult[]> {
    this.logger.log(`Searching TJ Karaoke for: ${query}`);
    const results: KaraokeResult[] = [];

    try {
      // Use utaitai's searchTJ function
      const searchGenerator = searchTJ({ query });

      // Collect results from the async generator
      for await (const tjResponse of searchGenerator) {
        const karaokeResult = tjResponseToKaraokeResult(tjResponse);
        results.push(karaokeResult);

        // Limit results to avoid too many results
        if (results.length >= 50) {
          break;
        }
      }

      this.logger.log(`Found ${results.length} results from TJ Karaoke`);
    } catch (error) {
      this.logger.log(`Error searching TJ Karaoke: ${error}`);
      this.logger.error('Failed to search TJ Karaoke');
    }

    return results;
  }
}
