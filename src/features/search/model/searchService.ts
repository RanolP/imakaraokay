import Fuse from 'fuse.js';
import type { Song } from '../../../types/song';
import type { SearchOptions, SearchResult, LanguagePreference } from '../types';
import { normalizeForSearch, normalizeArrayForSearch, safeNormalizeForSearch } from '../utils/normalization';

// Interface for normalized song data used by Fuse.js
interface NormalizedSong extends Song {
  _normalized: {
    title: {
      original: string;
      japanese?: {
        main: string;
        aliases: string[];
      };
      english?: {
        main: string;
        aliases: string[];
      };
      korean?: {
        main: string;
        aliases: string[];
      };
    };
    artists: string[];
    artistNames: {
      original: string[];
      japanese: string[];
      english: string[];
      korean: string[];
      aliases: string[];
    };
    lyrics: string;
  };
}

export class SearchService {
  private fuse: Fuse<NormalizedSong> | null = null;
  private songs: Song[] = [];
  private normalizedSongs: NormalizedSong[] = [];
  private artistsMap: Map<string, any> = new Map();

  constructor(songs: Song[] = []) {
    this.setSongs(songs);
  }

  setSongs(songs: Song[], artists: any[] = []) {
    this.songs = songs;
    
    // Create a map of artist ID to artist data for quick lookup
    this.artistsMap = new Map(artists.map(artist => [artist.id, artist]));
    
    this.normalizedSongs = this.createNormalizedSongs(songs);
    this.initializeFuse();
  }

  private createNormalizedSongs(songs: Song[]): NormalizedSong[] {
    return songs.map(song => {
      // Collect all artist names in all languages
      const artistNames = {
        original: [] as string[],
        japanese: [] as string[],
        english: [] as string[],
        korean: [] as string[],
        aliases: [] as string[]
      };

      song.artists.forEach(artistId => {
        const artist = this.artistsMap.get(artistId);
        if (artist) {
          // Add original name
          artistNames.original.push(artist.name.original);
          
          // Add Japanese names and aliases
          if (artist.name.japanese) {
            artistNames.japanese.push(artist.name.japanese.main);
            if (artist.name.japanese.aliases) {
              artistNames.aliases.push(...artist.name.japanese.aliases);
            }
          }
          
          // Add English names and aliases
          if (artist.name.english) {
            artistNames.english.push(artist.name.english.main);
            if (artist.name.english.aliases) {
              artistNames.aliases.push(...artist.name.english.aliases);
            }
          }
          
          // Add Korean names and aliases
          if (artist.name.korean) {
            artistNames.korean.push(artist.name.korean.main);
            if (artist.name.korean.aliases) {
              artistNames.aliases.push(...artist.name.korean.aliases);
            }
          }
        }
      });

      return {
        ...song,
        _normalized: {
          title: {
            original: normalizeForSearch(song.title.original),
            japanese: song.title.japanese ? {
              main: normalizeForSearch(song.title.japanese.main),
              aliases: normalizeArrayForSearch(song.title.japanese.aliases || []),
            } : undefined,
            english: song.title.english ? {
              main: normalizeForSearch(song.title.english.main),
              aliases: normalizeArrayForSearch(song.title.english.aliases || []),
            } : undefined,
            korean: song.title.korean ? {
              main: normalizeForSearch(song.title.korean.main),
              aliases: normalizeArrayForSearch(song.title.korean.aliases || []),
            } : undefined,
          },
          artists: normalizeArrayForSearch(song.artists),
          artistNames: {
            original: normalizeArrayForSearch(artistNames.original),
            japanese: normalizeArrayForSearch(artistNames.japanese),
            english: normalizeArrayForSearch(artistNames.english),
            korean: normalizeArrayForSearch(artistNames.korean),
            aliases: normalizeArrayForSearch(artistNames.aliases),
          },
          lyrics: safeNormalizeForSearch(song.lyrics),
        },
      };
    });
  }

  private initializeFuse() {
    const fuseOptions = {
      keys: [
        { name: '_normalized.title.original', weight: 2 },
        { name: '_normalized.title.japanese.main', weight: 2 },
        { name: '_normalized.title.japanese.aliases', weight: 1.5 },
        { name: '_normalized.title.english.main', weight: 2 },
        { name: '_normalized.title.english.aliases', weight: 1.5 },
        { name: '_normalized.title.korean.main', weight: 2 },
        { name: '_normalized.title.korean.aliases', weight: 1.5 },
        { name: '_normalized.artists', weight: 1.5 },
        { name: '_normalized.artistNames.original', weight: 1.8 },
        { name: '_normalized.artistNames.japanese', weight: 1.8 },
        { name: '_normalized.artistNames.english', weight: 1.8 },
        { name: '_normalized.artistNames.korean', weight: 1.8 },
        { name: '_normalized.artistNames.aliases', weight: 1.5 },
        { name: '_normalized.lyrics', weight: 0.5 },
      ],
      threshold: 0.3, // Fuzzy matching threshold
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    };

    this.fuse = new Fuse(this.normalizedSongs, fuseOptions);
  }

  search(options: SearchOptions): SearchResult {
    if (!this.fuse || this.normalizedSongs.length === 0) {
      return {
        songs: [],
        total: 0,
        query: options.query,
      };
    }

    let results: Song[] = [];

    if (options.query.trim()) {
      // Normalize the search query using NFKD
      const normalizedQuery = normalizeForSearch(options.query);
      
      // Perform fuzzy search with normalized query
      const fuseResults = this.fuse.search(normalizedQuery, {
        limit: options.limit || 50,
      });
      
      results = fuseResults.map(result => result.item);
    } else {
      // Return all songs if no query
      results = this.songs.slice(0, options.limit || 50);
    }

    // Apply filters
    if (options.filters) {
      results = this.applyFilters(results, options.filters);
    }

    return {
      songs: results,
      total: results.length,
      query: options.query,
    };
  }

  private applyFilters(
    songs: Song[], 
    filters: NonNullable<SearchOptions['filters']>
  ): Song[] {
    let filtered = songs;

    // Filter by artist
    if (filters.artist) {
      const normalizedFilterArtist = normalizeForSearch(filters.artist);
      filtered = filtered.filter(song => 
        song.artists.some(artistId => 
          normalizeForSearch(artistId).includes(normalizedFilterArtist)
        )
      );
    }

    // Filter by karaoke machine availability
    if (filters.hasKaraokeId) {
      filtered = filtered.filter(song => {
        return filters.hasKaraokeId!.some(machine => {
          switch (machine) {
            case 'tj': return !!song.karaoke.tj;
            case 'ky': return !!song.karaoke.ky;
            case 'ebo': return !!song.karaoke.ebo;
            case 'joysound': return !!song.karaoke.joysound;
            default: return false;
          }
        });
      });
    }

    return filtered;
  }

  // Helper methods for display
  getDisplayTitle(song: Song, preferredLang: LanguagePreference = 'original'): string {
    if (preferredLang !== 'original' && song.title[preferredLang]) {
      return song.title[preferredLang]!.main;
    }
    return song.title.original;
  }

  getAllTitleVariants(song: Song): string[] {
    const variants = [song.title.original];
    
    if (song.title.japanese) {
      variants.push(song.title.japanese.main);
      if (song.title.japanese.aliases) {
        variants.push(...song.title.japanese.aliases);
      }
    }
    
    if (song.title.english) {
      variants.push(song.title.english.main);
      if (song.title.english.aliases) {
        variants.push(...song.title.english.aliases);
      }
    }
    
    if (song.title.korean) {
      variants.push(song.title.korean.main);
      if (song.title.korean.aliases) {
        variants.push(...song.title.korean.aliases);
      }
    }
    
    return [...new Set(variants)]; // Remove duplicates
  }

  formatKaraokeIds(song: Song): string {
    const ids = [];
    if (song.karaoke.tj) ids.push(`TJ: ${song.karaoke.tj}`);
    if (song.karaoke.ky) ids.push(`KY: ${song.karaoke.ky}`);
    if (song.karaoke.ebo) ids.push(`EBO: ${song.karaoke.ebo}`);
    if (song.karaoke.joysound) ids.push(`JS: ${song.karaoke.joysound}`);
    return ids.join(' • ');
  }
}

// Export singleton instance
export const searchService = new SearchService(); 
