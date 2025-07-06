import type {
  KaraokeProvider,
  LyricsProvider,
  KaraokeResult,
  LyricsResult,
} from '../types/search-types.js';
import type { Logger } from '../utils/logger.js';

export interface SearchResults {
  karaoke: KaraokeResult[];
  lyrics: LyricsResult[];
}

export class SearchEngine {
  private karaokeProviders: KaraokeProvider[] = [];
  private lyricsProviders: LyricsProvider[] = [];

  constructor(private logger: Logger) {}

  addKaraokeProvider(provider: KaraokeProvider) {
    this.karaokeProviders.push(provider);
  }

  addLyricsProvider(provider: LyricsProvider) {
    this.lyricsProviders.push(provider);
  }

  async search(query: string): Promise<SearchResults> {
    // Search all providers in parallel
    const karaokePromises = this.karaokeProviders.map((provider) =>
      provider.search(query).catch((error) => {
        this.logger.log(`Error in ${provider.name}: ${error}`);
        return [];
      }),
    );

    const lyricsPromises = this.lyricsProviders.map((provider) =>
      provider.search(query).catch((error) => {
        this.logger.log(`Error in ${provider.name}: ${error}`);
        return [];
      }),
    );

    const [karaokeResults, lyricsResults] = await Promise.all([
      Promise.all(karaokePromises),
      Promise.all(lyricsPromises),
    ]);

    return {
      karaoke: karaokeResults.flat(),
      lyrics: lyricsResults.flat(),
    };
  }
}
