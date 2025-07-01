import { Component, createSignal, onMount, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { songService } from '../services/songService';
import { searchService } from '../features/search/model/searchService';
import type { Song } from '../types/song';
import type { SearchResult } from '../features/search/types';
import SongListItem from '../components/SongListItem';
import { useTranslation } from '../features/i18n';

const Home: Component = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = createSignal('');
  const [searchResults, setSearchResults] = createSignal<SearchResult>({
    songs: [],
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
      setSearchResults({ songs: [], total: 0, query: '' });
      return;
    }

    const songResults = searchService.search({
      query: query,
      limit: 50,
    });
    setSearchResults(songResults);
  };

  const isSearchActive = () => {
    return searchQuery().trim();
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Hero Section */}
      <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div class="container mx-auto px-4 py-16 text-center">
          <h1 class="text-4xl md:text-6xl font-bold mb-4">
            {t('home.title')}
          </h1>
          <p class="text-xl md:text-2xl mb-8 opacity-90">
            {t('home.subtitle')}
          </p>
          
          {/* Simple Search Interface */}
          <div class="max-w-2xl mx-auto">
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
        </div>
      </div>

      <div class="container mx-auto px-4 py-8">
        <Show when={loading()}>
          <div class="text-center py-12">
            <div class="text-lg text-gray-600">{t('home.loading')}</div>
          </div>
        </Show>

        <Show when={!loading()}>
          {/* Search Results */}
          <Show when={isSearchActive() && searchResults().songs.length > 0}>
            <div class="mb-8">
              <h2 class="text-2xl font-bold mb-4 text-gray-800">
                {t('home.searchResults')} ({searchResults().total} found)
              </h2>
              <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <For each={searchResults().songs}>
                  {(song) => (
                    <A
                      href={`/songs/${song.id}`}
                      class="block border-b border-gray-100 last:border-b-0"
                    >
                      <SongListItem song={song} />
                    </A>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* No Results */}
          <Show when={isSearchActive() && searchResults().songs.length === 0}>
            <div class="text-center py-12">
              <div class="text-xl text-gray-600 mb-2">
                No songs found for "{searchQuery()}"
              </div>
              <div class="text-gray-500">
                Try searching with different keywords or check the spelling
              </div>
            </div>
          </Show>

          {/* Popular Songs (shown when no search query) */}
          <Show when={!isSearchActive() && popularSongs().length > 0}>
            <div>
              <h2 class="text-2xl font-bold mb-6 text-gray-800">
                {t('home.popularSongs')}
              </h2>
              <div class="bg-white rounded-lg shadow-md overflow-hidden">
                <For each={popularSongs()}>
                  {(song) => (
                    <A
                      href={`/songs/${song.id}`}
                      class="block border-b border-gray-100 last:border-b-0"
                    >
                      <SongListItem song={song} />
                    </A>
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

export default Home;
