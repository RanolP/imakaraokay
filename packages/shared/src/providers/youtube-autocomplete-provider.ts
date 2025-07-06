import { AutocompleteProvider, AutocompleteResult } from '../types/search-types.js';
import { safeFetch } from '../utils/fetch-utils.js';
import { Logger } from '../utils/logger.js';

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

      const params = new URLSearchParams({
        client: 'firefox',
        ds: 'yt',
        q: query,
      });

      const url = `http://suggestqueries.google.com/complete/search?${params.toString()}`;

      const response = await safeFetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();

      // Try to parse as JSON directly first
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        // If that fails, try to extract JSON from JSONP format
        const jsonMatch = text.match(/\[.*\]/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid response format');
        }
      }

      // YouTube autocomplete returns an array where the second element contains suggestions
      if (Array.isArray(data) && data.length > 1 && Array.isArray(data[1])) {
        const suggestions = data[1] as string[];

        for (const suggestion of suggestions) {
          if (typeof suggestion === 'string' && suggestion.trim()) {
            results.push({
              suggestion: suggestion.trim(),
              source: 'YouTube',
            });
          }
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
