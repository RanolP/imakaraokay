import type { Song } from '../types/song';
import type { Language } from '../features/i18n/types';
import { songService } from '../services/songService';

export interface FormattedSongItem {
  titleLine: string;
  idsLine: string;
}

/**
 * Formats a song according to the template:
 * ⟨{{current language}} (if it is different to original, {{original}})⟩ -− {{artist in current language}}
 * {{song ids}}
 */
export function formatSongListItem(
  song: Song,
  currentLanguage: Language = 'ko'
): FormattedSongItem {
  // Map i18n language to song title language
  const langMapping: Record<Language, keyof Song['title']> = {
    ko: 'korean',
    en: 'english',
  };

  const songLang = langMapping[currentLanguage];

  // Get title in current language, fallback to original
  let currentTitle = song.title.original;
  if (songLang && song.title[songLang]) {
    const langTitle = song.title[songLang];
    if (langTitle && typeof langTitle === 'object' && 'main' in langTitle) {
      currentTitle = langTitle.main;
    }
  }

  // Get original title
  const originalTitle = song.title.original;

  // Format title line
  let titleLine = `⟨${currentTitle}`;
  if (currentTitle !== originalTitle) {
    titleLine += ` (${originalTitle})`;
  }
  titleLine += '⟩';

  // Get artist names in current language
  const artistNames = song.artists
    .map((artistId) => {
      // Map i18n language to artist language preference
      const artistLangPreference: Record<Language, 'original' | 'japanese' | 'english' | 'korean'> =
        {
          ko: 'korean',
          en: 'english',
        };

      return songService.getDisplayArtist(artistId, artistLangPreference[currentLanguage]);
    })
    .join(', ');

  titleLine += ` -− ${artistNames}`;

  // Format karaoke IDs
  const ids: string[] = [];
  if (song.karaoke.tj) ids.push(`TJ:${song.karaoke.tj}`);
  if (song.karaoke.ky) ids.push(`KY:${song.karaoke.ky}`);
  if (song.karaoke.ebo) ids.push(`EBO:${song.karaoke.ebo}`);
  if (song.karaoke.joysound) ids.push(`JS:${song.karaoke.joysound}`);

  const idsLine = ids.join(' ');

  return {
    titleLine,
    idsLine,
  };
}

/**
 * Formats a song as a multi-line string
 */
export function formatSongListItemAsString(song: Song, currentLanguage: Language = 'ko'): string {
  const formatted = formatSongListItem(song, currentLanguage);
  return `${formatted.titleLine}\n${formatted.idsLine}`;
}
