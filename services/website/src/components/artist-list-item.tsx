import { Component, createMemo } from 'solid-js';
import type { Artist } from '../types/song';
import { useTranslation } from '../features/i18n';

interface ArtistListItemProps {
  artist: Artist;
  class?: string;
}

const ArtistListItem: Component<ArtistListItemProps> = (props) => {
  const { language } = useTranslation();

  // Get artist name in current language, fallback to original
  const getCurrentName = () => {
    const langMapping = {
      ko: 'korean' as const,
      en: 'english' as const
    };
    
    const artistLang = langMapping[language()];
    let currentName = props.artist.name.original;
    
    if (artistLang && props.artist.name[artistLang]) {
      const langName = props.artist.name[artistLang];
      if (langName && typeof langName === 'object' && 'main' in langName) {
        currentName = langName.main;
      }
    }
    
    return currentName;
  };

  // Make these values reactive so they update when language changes
  const currentName = createMemo(() => getCurrentName());
  const originalName = props.artist.name.original;
  const showOriginal = createMemo(() => currentName() !== originalName);

  // Format debut date if available
  const formatDebutDate = () => {
    if (!props.artist.debutDate) return null;
    
    try {
      const date = new Date(props.artist.debutDate);
      return date.getFullYear();
    } catch {
      return null;
    }
  };

  return (
    <div class={`p-4 hover:bg-gray-50 transition-colors ${props.class || ''}`}>
      {/* Artist Name Line */}
      <div class="text-lg font-semibold text-gray-900 mb-2 leading-tight">
        <span class="text-orange-500">🎤</span>
        <span class="ml-2 text-purple-600">⟨</span>
        {currentName()}
        {showOriginal() && (
          <span class="text-gray-600"> ({originalName})</span>
        )}
        <span class="text-purple-600">⟩</span>
        <span class="text-sm text-gray-500 ml-2">Artist</span>
      </div>
      
      {/* Artist Info */}
      <div class="text-sm text-gray-600 space-y-1">
        <div>
          <span class="font-medium">{props.artist.songCount}</span> songs
          {formatDebutDate() && (
            <span class="ml-4">
              <span class="font-medium">Debut:</span> {formatDebutDate()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistListItem; 
