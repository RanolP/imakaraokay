import { isServer } from 'solid-js/web';
import type { Song, Artist } from '../types/song';

export class SongService {
  private songs: Song[] = [];
  private artists: Artist[] = [];
  private isLoaded = false;

  async loadSongs(): Promise<Song[]> {
    if (this.isLoaded) {
      return this.songs;
    }

    // Skip loading during SSR
    if (isServer) {
      console.log('Skipping song loading during SSR');
      return [];
    }

    try {
      // Load songs data from individual files organized by release year
      await this.loadSongsFromDirectoryStructure();

      // Load artists data from individual files organized by debut year
      try {
        await this.loadArtistsFromDirectoryStructure();
      } catch {
        // Artists data is optional, generate from songs if not available
        this.generateArtistsFromSongs();
      }

      this.isLoaded = true;

      console.log(`📚 Loaded ${this.songs.length} songs and ${this.artists.length} artists`);
      return this.songs;
    } catch (error) {
      console.error('Failed to load songs:', error);
      // Return empty array for development/fallback
      return [];
    }
  }

  private async loadSongsFromDirectoryStructure() {
    // Known release years - expand this array as more songs are added
    const knownYears = ['2018', '2019', '2020'];
    const loadedSongs: Song[] = [];

    // Load songs from each year directory
    for (const year of knownYears) {
      try {
        // Get all song files in the year directory
        // We'll use a known list of song IDs for now, but this could be made more dynamic
        const songIds = this.getKnownSongIds(year);
        
        for (const songId of songIds) {
          try {
            const songResponse = await fetch(`/data/songs/${year}/${songId}.json`);
            if (songResponse.ok) {
              const song: Song = await songResponse.json();
              loadedSongs.push(song);
            }
          } catch {
            // Skip missing song files
          }
        }
      } catch {
        // Skip missing year directories
      }
    }

    this.songs = loadedSongs;
    
    if (this.songs.length === 0) {
      console.warn('No songs loaded from directory structure');
    }
  }

  private getKnownSongIds(year: string): string[] {
    // Map of known songs by year - this could be made more dynamic in the future
    const songsByYear: { [key: string]: string[] } = {
      '2018': ['lemon'],
      '2019': ['yoru-ni-kakeru', 'gurenge'],
      '2020': ['dynamite']
    };
    
    return songsByYear[year] || [];
  }

  private async loadArtistsFromDirectoryStructure() {
    // Known debut years - expand this array as more artists are added
    const knownYears = ['2010', '2012', '2013', '2019'];
    const loadedArtists: Artist[] = [];
    const artistIds = this.getKnownArtistIds();

    // For each artist, try to find them in any of the year directories
    for (const artistId of artistIds) {
      let artistFound = false;
      
      for (const year of knownYears) {
        if (artistFound) break; // Skip remaining years once found
        
        try {
          const artistResponse = await fetch(`/data/artists/${year}/${artistId}.json`);
          if (artistResponse.ok) {
            const artist: Artist = await artistResponse.json();
            loadedArtists.push(artist);
            artistFound = true;
          }
        } catch {
          // Continue to next year
        }
      }
    }

    this.artists = loadedArtists;
    
    // If no artists were loaded, generate from songs as fallback
    if (this.artists.length === 0) {
      this.generateArtistsFromSongs();
    }
  }

  private getKnownArtistIds(): string[] {
    // Extract unique artist IDs from songs data
    const artistIds = new Set<string>();
    this.songs.forEach(song => {
      song.artists.forEach(id => artistIds.add(id));
    });
    return Array.from(artistIds);
  }

  private generateArtistsFromSongs() {
    const artistMap = new Map<string, Set<string>>();

    this.songs.forEach(song => {
      song.artists.forEach(artistId => {
        if (!artistMap.has(artistId)) {
          artistMap.set(artistId, new Set());
        }
        artistMap.get(artistId)!.add(song.id);
      });
    });

    this.artists = Array.from(artistMap.entries()).map(([id, songIds]) => ({
      id,
      name: {
        original: id, // Fallback - in real data this would be proper multilingual name
      },
      songs: Array.from(songIds),
      songCount: songIds.size,
    }));
  }

  getSongById(id: string): Song | undefined {
    return this.songs.find(song => song.id === id);
  }

  getArtistById(id: string): Artist | undefined {
    return this.artists.find(artist => artist.id === id);
  }

  getAllSongs(): Song[] {
    return [...this.songs];
  }

  getArtists(): Artist[] {
    return [...this.artists];
  }

  getPopularSongs(limit: number = 20): Song[] {
    // Return songs sorted by karaoke machine coverage
    return this.songs
      .sort((a, b) => {
        const aCount = Object.values(a.karaoke).filter(Boolean).length;
        const bCount = Object.values(b.karaoke).filter(Boolean).length;
        return bCount - aCount;
      })
      .slice(0, limit);
  }

  // Helper methods to get display strings from multilingual content
  getDisplayTitle(song: Song, preferredLang: 'original' | 'japanese' | 'english' | 'korean' = 'original'): string {
    if (preferredLang !== 'original' && song.title[preferredLang]) {
      return song.title[preferredLang]!.main;
    }
    return song.title.original;
  }

  getDisplayArtist(artistId: string, preferredLang: 'original' | 'japanese' | 'english' | 'korean' = 'original'): string {
    const artist = this.getArtistById(artistId);
    if (!artist) return artistId;

    if (preferredLang !== 'original' && artist.name[preferredLang]) {
      return artist.name[preferredLang]!.main;
    }
    return artist.name.original;
  }

  getIsLoaded(): boolean {
    return this.isLoaded;
  }
}

// Export singleton instance
export const songService = new SongService(); 
