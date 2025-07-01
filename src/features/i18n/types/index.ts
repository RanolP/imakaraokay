export interface TranslationKeys {
  // Navigation
  nav: {
    home: string;
    about: string;
    error: string;
  };
  
  // Homepage
  home: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    searchResults: string;
    noResults: {
      title: string;
      subtitle: string;
    };
    popularSongs: string;
    loading: string;
  };
  
  // About page
  about: {
    title: string;
    description: string;
    weLovenpm: string;
  };
  
  // Common
  common: {
    search: string;
    loading: string;
    error: string;
  };
  
  // Song details
  song: {
    artists: string;
    originalTitle: string;
    englishTitle: string;
    lyrics: string;
    noLyrics: string;
    availableOn: string;
  };
}

export type Language = 'ko' | 'en'; 
