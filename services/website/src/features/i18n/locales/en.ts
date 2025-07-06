import type { TranslationKeys } from '../types';

export const en: TranslationKeys = {
  nav: {
    home: 'Home',
    about: 'About',
    error: 'Error',
  },

  home: {
    title: '🎤 imakaraokay',
    subtitle: 'Find your favorite songs across all karaoke machines',
    searchPlaceholder: 'Search by song title, artist, or lyrics...',
    searchResults: 'Search Results',
    noResults: {
      title: 'No songs found',
      subtitle: 'Try searching with different keywords or check the spelling',
    },
    popularSongs: '🔥 Popular Songs',
    loading: 'Loading songs...',
  },

  about: {
    title: 'About',
    description: 'A page all about this website.',
    weLovenpm: 'We love',
  },

  common: {
    search: 'Search',
    loading: 'Loading',
    error: 'Error',
  },

  song: {
    artists: 'Artists',
    originalTitle: 'Original Title',
    englishTitle: 'English Title',
    lyrics: 'Lyrics',
    noLyrics: 'No lyrics available',
    availableOn: 'Available on',
  },
};
