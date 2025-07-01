import { Component, createSignal, onMount, Show, For, createMemo } from 'solid-js';
import { useParams } from '@solidjs/router';
import { songService } from '../../services/songService';
import type { Song } from '../../types/song';
import KaraokeBadges from '../../components/KaraokeBadges';
import { useTranslation } from '../../features/i18n';

interface TitleVariant {
  lang: string;
  title: string;
  aliases?: string[];
}

const SongDetail: Component = () => {
  const params = useParams();
  const { language } = useTranslation();
  const [song, setSong] = createSignal<Song | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  onMount(async () => {
    try {
      // Load song data if not already loaded
      if (!songService.getIsLoaded()) {
        await songService.loadSongs();
      }
      
      // Get song by ID from URL params
      const foundSong = songService.getSongById(params.id);
      
      if (foundSong) {
        setSong(foundSong);
      } else {
        setError(`Song with ID "${params.id}" not found`);
      }
    } catch (err) {
      setError('Failed to load song data');
      console.error('Error loading song:', err);
    } finally {
      setLoading(false);
    }
  });

  const formatReleaseDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Language-aware display functions for the header
  const getDisplayTitle = createMemo(() => {
    const currentSong = song();
    if (!currentSong) return '';
    
    const langMapping = {
      ko: 'korean' as const,
      en: 'english' as const
    };
    
    const preferredLang = langMapping[language()];
    return songService.getDisplayTitle(currentSong, preferredLang || 'original');
  });

  const getDisplayArtists = createMemo(() => {
    const currentSong = song();
    if (!currentSong) return '';
    
    const langMapping = {
      ko: 'korean' as const,
      en: 'english' as const
    };
    
    const preferredLang = langMapping[language()];
    return currentSong.artists
      .map(artistId => songService.getDisplayArtist(artistId, preferredLang || 'original'))
      .join(', ');
  });

  const getAllTitleVariants = (song: Song): TitleVariant[] => {
    const variants: TitleVariant[] = [
      { lang: 'Original', title: song.title.original }
    ];

    if (song.title.japanese) {
      variants.push({
        lang: 'Japanese',
        title: song.title.japanese.main,
        aliases: song.title.japanese.aliases
      });
    }

    if (song.title.english) {
      variants.push({
        lang: 'English',
        title: song.title.english.main,
        aliases: song.title.english.aliases
      });
    }

    if (song.title.korean) {
      variants.push({
        lang: 'Korean',
        title: song.title.korean.main,
        aliases: song.title.korean.aliases
      });
    }

    return variants;
  };

  return (
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <Show when={loading()}>
        <div class="flex justify-center items-center h-64">
          <div class="text-lg">Loading song details...</div>
        </div>
      </Show>

      <Show when={error()}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong class="font-bold">Error!</strong>
          <span class="block sm:inline"> {error()}</span>
        </div>
      </Show>

      <Show when={song() && !loading()}>
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <h1 class="text-3xl font-bold mb-2">{getDisplayTitle()}</h1>
            <p class="text-lg font-semibold">by {getDisplayArtists()}</p>
            <Show when={song()!.releaseDate}>
              <p class="text-sm opacity-75 mt-1">Released: {formatReleaseDate(song()!.releaseDate!)}</p>
            </Show>
          </div>

          <div class="p-6">
            {/* Title Variants */}
            <Show when={getAllTitleVariants(song()!).length > 1}>
              <div class="mb-8">
                <h3 class="text-lg font-semibold mb-3 text-gray-800">Title Variations</h3>
                <div class="space-y-3">
                  <For each={getAllTitleVariants(song()!)}>
                    {(variant) => (
                      <div class="bg-gray-50 p-3 rounded">
                        <div class="font-medium text-gray-800">{variant.lang}</div>
                        <div class="text-lg">{variant.title}</div>
                        <Show when={variant.aliases && variant.aliases.length > 0}>
                          <div class="text-sm text-gray-600 mt-1">
                            Aliases: {variant.aliases!.join(', ')}
                          </div>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Karaoke IDs */}
            <div class="mb-8">
              <h3 class="text-lg font-semibold mb-4 text-gray-800">Karaoke Machine IDs</h3>
              <KaraokeBadges song={song()!} size="lg" layout="vertical" />
            </div>

            {/* Lyrics */}
            <Show when={song()!.lyrics}>
              <div>
                <h3 class="text-lg font-semibold mb-3 text-gray-800">Lyrics</h3>
                <div class="bg-gray-50 p-4 rounded-lg">
                  <pre class="whitespace-pre-wrap text-gray-700 font-mono text-sm leading-relaxed">
                    {song()!.lyrics}
                  </pre>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default SongDetail; 
