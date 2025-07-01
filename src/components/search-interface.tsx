import { Component, createSignal, onMount, For, Show } from 'solid-js';
import { songService } from '../services/song-service';
import { searchService } from '../features/search/model/search-service';
import type { Song } from '../types/song';
import type { SearchResult } from '../features/search/types';
import SongListItem from './song-list-item';
import ArtistListItem from './artist-list-item';
import { useTranslation } from '../features/i18n';

interface SearchInterfaceProps {
  class?: string;
}

const SearchInterface: Component<SearchInterfaceProps> = (props) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = createSignal('');
  const [searchResults, setSearchResults] = createSignal<SearchResult>({
    songs: [],
    artists: [],
    total: 0,
    query: '',
  });
  const [loading, setLoading] = createSignal(true);
  const [popularSongs, setPopularSongs] = createSignal<Song[]>([]);

  onMount(async () => {
    try {
      const songs = await songService.loadSongs();
      const artists = songService.getArtists();
      
      // Pass both songs and artists to search service for enhanced artist name search
      searchService.setSongs(songs, artists);
      setPopularSongs(songService.getPopularSongs(10));
    } catch (error) {
      console.error('Failed to load songs:', error);
    } finally {
      setLoading(false);
    }
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults({ songs: [], artists: [], total: 0, query: '' });
      return;
    }

    const results = searchService.search({
      query: query,
      limit: 50,
    });
    setSearchResults(results);
  };

  const isSearchActive = () => {
    return searchQuery().trim();
  };

  const hasResults = () => {
    const results = searchResults();
    return results.songs.length > 0 || results.artists.length > 0;
  };

  return (
    <div class={props.class}>
      {/* Search Input */}
      <div class="max-w-2xl mx-auto mb-8">
        <div class="relative">
          <input
            type="text"
            placeholder={t('home.searchPlaceholder')}
            value={searchQuery()}
            onInput={(e) => handleSearch(e.currentTarget.value)}
            class="w-full px-6 py-4 text-lg text-gray-800 rounded-full border-0 shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-300"
          />
          <div class="absolute right-4 top-1/2 transform -translate-y-1/2">
            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div class="w-full px-4">
        <Show when={loading()}>
          <div class="text-center py-12">
            <div class="text-lg text-gray-600">{t('home.loading')}</div>
          </div>
        </Show>

        <Show when={!loading()}>
          {/* Search Results */}
          <Show when={isSearchActive() && hasResults()}>
            <div class="mb-8">
              <h2 class="text-2xl font-bold mb-4 text-gray-200">
                {t('home.searchResults')} ({searchResults().total} found)
              </h2>
              
              {/* Responsive grid layout for side-by-side on wider screens */}
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Song Results - Show first and take more space */}
                <Show when={searchResults().songs.length > 0}>
                  <div class="lg:col-span-1 lg:order-1">
                    <h3 class="text-lg font-semibold mb-3 text-gray-200">
                      Songs ({searchResults().songs.length})
                    </h3>
                    <div class="bg-white rounded-lg shadow-md overflow-hidden">
                      <For each={searchResults().songs}>
                        {(song) => (
                          <a
                            href={`/songs/${song.id}`}
                            class="block border-b border-gray-100 last:border-b-0 text-inherit no-underline"
                          >
                            <SongListItem song={song} />
                          </a>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>

                {/* Artist Results - Show second */}
                <Show when={searchResults().artists.length > 0}>
                  <div class="lg:col-span-1 lg:order-2">
                    <h3 class="text-lg font-semibold mb-3 text-gray-300">
                      Artists ({searchResults().artists.length})
                    </h3>
                    <div class="bg-white rounded-lg shadow-md overflow-hidden">
                      <For each={searchResults().artists}>
                        {(artist) => (
                          <a
                            href={`/artists/${artist.id}`}
                            class="block border-b border-gray-100 last:border-b-0"
                          >
                            <ArtistListItem artist={artist} />
                          </a>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          {/* No Results */}
          <Show when={isSearchActive() && !hasResults()}>
            <div class="text-center py-12">
              <div class="text-xl text-gray-200 mb-2">
                No songs or artists found for "{searchQuery()}"
              </div>
              <div class="text-gray-400">
                Try searching with different keywords or check the spelling
              </div>
            </div>
          </Show>

          {/* Popular Songs (shown when no search query) */}
          <Show when={!isSearchActive() && popularSongs().length > 0}>
            <div>
              <h2 class="text-2xl font-bold mb-6 text-gray-200">
                {t('home.popularSongs')}
              </h2>
              <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <For each={popularSongs()}>
                  {(song) => (
                    <a
                      href={`/songs/${song.id}`}
                      class="block border-b border-gray-100 last:border-b-0 text-inherit no-underline"
                    >
                      <SongListItem song={song} />
                    </a>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
};

export default SearchInterface; 
