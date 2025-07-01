import { Component, createMemo } from 'solid-js';
import type { Song } from '../types/song';
import KaraokeBadges from './karaoke-badges';
import { useTranslation } from '../features/i18n';
import { songService } from '../services/song-service';

interface SongListItemProps {
  song: Song;
  class?: string;
}

const SongListItem: Component<SongListItemProps> = (props) => {
  const { language } = useTranslation();

  // Get title in current language, fallback to original
  const getCurrentTitle = () => {
    const langMapping = {
      ko: 'korean' as const,
      en: 'english' as const
    };
    
    const songLang = langMapping[language()];
    let currentTitle = props.song.title.original;
    
    if (songLang && props.song.title[songLang]) {
      const langTitle = props.song.title[songLang];
      if (langTitle && typeof langTitle === 'object' && 'main' in langTitle) {
        currentTitle = langTitle.main;
      }
    }
    
    return currentTitle;
  };

  // Get artist names in current language
  const getArtistNames = () => {
    const artistLangPreference = {
      ko: 'korean' as const,
      en: 'english' as const
    };

    return props.song.artists
      .map((artistId, idx) => {
        const displayName = songService.getDisplayArtist(artistId, artistLangPreference[language()]);
        // Link to artist page (assuming /artists/[id])
        return (
          <a
            href={`/artists/${artistId}`}
            class="text-blue-600 hover:underline"
            rel="noopener"
            tabIndex={0}
          >
            {displayName}
          </a>
        );
      })
  };

  // Make these values reactive so they update when language changes
  const currentTitle = createMemo(() => getCurrentTitle());
  const originalTitle = props.song.title.original;
  const showOriginal = createMemo(() => currentTitle() !== originalTitle);

  return (
    <div class={`p-4 hover:bg-gray-50 transition-colors ${props.class || ''}`}>
      {/* Title Line */}
      <div class="text-lg font-semibold text-gray-900 mb-2 leading-tight">
        <span class="text-purple-600">⟨</span>
        {currentTitle()}
        {showOriginal() && (
          <span class="text-gray-600"> ({originalTitle})</span>
        )}
        <span class="text-purple-600">⟩</span>
        <span class="text-gray-400 mx-2">—</span>
        <span class="text-gray-700">{getArtistNames()}</span>
      </div>
      
      {/* Karaoke IDs using the great badge system */}
      <div class="mt-3">
        <KaraokeBadges song={props.song} size="sm" />
      </div>
    </div>
  );
};

export default SongListItem; 
