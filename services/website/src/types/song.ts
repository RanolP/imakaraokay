export interface Alias {
  text: string;
  hidden?: boolean;
}

export interface AliasableString {
  /**
   * The main headword 
   */
  main: string;
  /**
   * Aliases for search
   */
  aliases?: Alias[];
}

export interface MultilingualSearchableString {
  /**
   * The content in original language
   */
  original: string;
  /**
   * The content in Japanese
   */
  japanese?: AliasableString;
  /**
   * The content in English
   */
  english?: AliasableString;
  /**
   * The content in Korean
   */
  korean?: AliasableString;
}

export interface Song {
  /**
   * The unique ID of song.
   * Usually pronounciation of the originall title transcribed to alphabet.
   */
  id: string;

  /**
   * The title of song
   */
  title: MultilingualSearchableString;

  /**
   * The set of Artis ID
   */
  artists: string[];

  /**
   * The ID for each karaoke machine
   */
  karaoke: {
    tj?: string;
    ky?: string;
    ebo?: string;
    joysound?: string;
  };

  /**
   * The release date in ISO format
   */
  releaseDate?: string;

  /**
   * The lyric of song
   */
  lyrics?: string;
}

export interface Artist {
  /**
   * The unique id of Artist
   * usually the pronunciation transcribed to alphabet
   */
  id: string;

  /**
   * The name of artist
   */
  name: MultilingualSearchableString;

  /**
   * The set of song ID (computed dynamically, not stored in raw data)
   */
  songs?: string[];

  /**
   * The number of songs (computed dynamically, not stored in raw data)
   */
  songCount?: number;

  /**
   * The debut date in ISO format
   */
  debutDate?: string;
}
