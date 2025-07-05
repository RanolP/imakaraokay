// Shared types for karaoke data
export interface KaraokeSong {
  id: string;
  title: string;
  artist: string;
  tjId?: string;
  kyId?: string;
  joysoundId?: string;
  eboId?: string;
  lyrics?: string;
  genre?: string;
  year?: number;
}

export interface SearchResult {
  songs: KaraokeSong[];
  total: number;
  query: string;
  provider: string;
}

export interface SearchProvider {
  name: string;
  search(query: string): Promise<SearchResult>;
}

export type KaraokeProvider = 'TJ' | 'KY' | 'Joysound' | 'EBO';

export interface KaraokeMachineInfo {
  id: KaraokeProvider;
  name: string;
  color: string;
  website?: string;
} 
