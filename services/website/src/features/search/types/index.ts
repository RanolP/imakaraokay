import type { Song, Artist } from '../../../types/song';

export interface SearchOptions {
  query: string;
  filters?: {
    artist?: string;
    hasKaraokeId?: ('tj' | 'ky' | 'ebo' | 'joysound')[];
  };
  limit?: number;
}

export interface SearchResult {
  songs: Song[];
  artists: Artist[];
  total: number;
  query: string;
}

export interface SearchFilters {
  artist?: string;
  hasKaraokeId?: ('tj' | 'ky' | 'ebo' | 'joysound')[];
}

export type KaraokeMachine = 'tj' | 'ky' | 'ebo' | 'joysound';

export type LanguagePreference = 'original' | 'japanese' | 'english' | 'korean'; 
