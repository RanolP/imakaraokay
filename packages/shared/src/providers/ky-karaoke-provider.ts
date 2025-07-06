import { searchKY } from '@imakaraokay/utaitai';
import type { KaraokeProvider, KaraokeResult } from '../types/search-types.js';
import { kyResponseToKaraokeResult } from '../types/search-types.js';
import type { Logger } from '../utils/logger.js';

export class KYKaraokeProvider implements KaraokeProvider {
  name = 'KY Karaoke';

  constructor(private logger: Logger) {}

  async search(query: string): Promise<KaraokeResult[]> {
    this.logger.log(`Searching KY Karaoke for: ${query}`);
    const results: KaraokeResult[] = [];

    try {
      // Use utaitai's searchKY function
      const searchGenerator = searchKY({ query });

      // Collect results from the async generator
      for await (const kyResponse of searchGenerator) {
        const karaokeResult = kyResponseToKaraokeResult(kyResponse);
        results.push(karaokeResult);

        // Limit results to avoid too many results
        if (results.length >= 50) {
          break;
        }
      }

      this.logger.log(`Found ${results.length} results from KY Karaoke`);
    } catch (error) {
      this.logger.log(`Error searching KY Karaoke: ${error}`);
      this.logger.error('Failed to search KY Karaoke');
    }

    return results;
  }
}
