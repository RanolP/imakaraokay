// Import TjResponse from utaitai
import type { TjResponse } from '@imakaraokay/utaitai';

export interface KaraokeResult {
  id: string;
  title: string;
  artist?: string;
  source: 'TJ' | 'KY';
  // Additional TJ-specific fields
  tags?: string[];
  lyricist?: string;
  composer?: string;
  youtube?: string;
}

export interface LyricsResult {
  title: string;
  artist?: string;
  url: string;
  source: 'MusixMatch' | 'Vocaro';
}

export interface AutocompleteResult {
  suggestion: string;
  source: 'YouTube' | 'Google' | 'Local';
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

export interface AutocompleteProvider {
  name: string;
  getSuggestions(query: string): Promise<AutocompleteResult[]>;
}

/**
 * Converts a TjResponse from utaitai to a KaraokeResult
 */
export function tjResponseToKaraokeResult(tjResponse: TjResponse): KaraokeResult {
  // Convert title array to a single string
  const title = tjResponse.title.map((part: { content: string; highlight: boolean }) => part.content).join('');

  return {
    id: tjResponse.id.toString(),
    title,
    artist: tjResponse.singer,
    source: 'TJ' as const,
    tags: tjResponse.tags,
    lyricist: tjResponse.lyricist,
    composer: tjResponse.composer,
    youtube: tjResponse.youtube,
  };
}
