import { completeYouTube } from '@imakaraokay/utaitai';
import type { AutocompleteProvider, AutocompleteResult } from '../types/search-types.js';
import type { Logger } from '../utils/logger.js';

export class YouTubeAutocompleteProvider implements AutocompleteProvider {
  name = 'YouTube Autocomplete';

  constructor(private logger: Logger) { }

  async getSuggestions(query: string): Promise<AutocompleteResult[]> {
    this.logger.log(`Getting YouTube autocomplete suggestions for: ${query}`);
    const results: AutocompleteResult[] = [];

    try {
      if (!query.trim()) {
        return results;
      }

      const suggestions = await completeYouTube({ query });

      for (const suggestion of suggestions) {
        if (typeof suggestion === 'string' && suggestion.trim()) {
          results.push({
            suggestion: suggestion.trim(),
            source: 'YouTube',
          });
        }
      }

      this.logger.log(`Found ${results.length} suggestions from YouTube`);
    } catch (error) {
      this.logger.log(`Error getting YouTube autocomplete suggestions: ${error}`);
      this.logger.error('Failed to get YouTube autocomplete suggestions');
    }

    return results;
  }
}
