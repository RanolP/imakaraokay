export interface KaraokeResult {
  id: string;
  title: string;
  artist?: string;
  source: 'TJ' | 'KY';
}

export interface LyricsResult {
  title: string;
  artist?: string;
  url: string;
  source: 'MusixMatch' | 'Vocaro';
}

export interface SearchOptions {
  query: string;
  verbose?: boolean;
}

export interface SearchProvider {
  name: string;
  search(query: string): Promise<KaraokeResult[] | LyricsResult[]>;
}

export interface KaraokeProvider extends SearchProvider {
  search(query: string): Promise<KaraokeResult[]>;
}

export interface LyricsProvider extends SearchProvider {
  search(query: string): Promise<LyricsResult[]>;
}
