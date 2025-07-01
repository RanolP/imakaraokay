import type { Song, Artist } from '../types/song';

export class SongService {
  private songs: Song[] = [];
  private artists: Artist[] = [];
  private isLoaded = false;

  async loadSongs(): Promise<Song[]> {
    if (this.isLoaded) {
      return this.songs;
    }

    try {
      // Load songs data
      const songsResponse = await fetch('/data/songs.json');
      if (!songsResponse.ok) {
        throw new Error(`Failed to load songs: ${songsResponse.statusText}`);
      }
      this.songs = await songsResponse.json();

      // Load artists data if available
      try {
        const artistsResponse = await fetch('/data/artists.json');
        if (artistsResponse.ok) {
          this.artists = await artistsResponse.json();
        }
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
