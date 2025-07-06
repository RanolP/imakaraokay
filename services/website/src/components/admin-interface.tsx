import { Component, createSignal, onMount, For, Show, createEffect } from 'solid-js';
import type { Song, Artist } from '../types/song';

interface AdminInterfaceProps {
  class?: string;
}

type Tab = 'songs' | 'artists';

interface SongFormData {
  id: string;
  title: {
    original: string;
    japanese?: {
      main: string;
      aliases?: Array<{ text: string; hidden?: boolean }>;
    };
    english?: {
      main: string;
      aliases?: Array<{ text: string; hidden?: boolean }>;
    };
    korean?: {
      main: string;
      aliases?: Array<{ text: string; hidden?: boolean }>;
    };
  };
  artists: string[];
  karaoke: {
    tj?: string;
    ky?: string;
    ebo?: string;
    joysound?: string;
  };
  releaseDate?: string;
  lyrics?: string;
}

interface ArtistFormData {
  id: string;
  name: {
    original: string;
    japanese?: {
      main: string;
      aliases?: Array<{ text: string; hidden?: boolean }>;
    };
    english?: {
      main: string;
      aliases?: Array<{ text: string; hidden?: boolean }>;
    };
    korean?: {
      main: string;
      aliases?: Array<{ text: string; hidden?: boolean }>;
    };
  };
  songs: string[];
  songCount: number;
  debutDate?: string;
}

const AdminInterface: Component<AdminInterfaceProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<Tab>('songs');
  const [songs, setSongs] = createSignal<Song[]>([]);
  const [artists, setArtists] = createSignal<Artist[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);
  
  // Search and filter states
  const [songSearchQuery, setSongSearchQuery] = createSignal('');
  const [artistSearchQuery, setArtistSearchQuery] = createSignal('');
  
  // Form states
  const [editingSong, setEditingSong] = createSignal<Song | null>(null);
  const [editingArtist, setEditingArtist] = createSignal<Artist | null>(null);
  const [showSongForm, setShowSongForm] = createSignal(false);
  const [showArtistForm, setShowArtistForm] = createSignal(false);
  
  // Form data
  const [songFormData, setSongFormData] = createSignal<SongFormData>({
    id: '',
    title: { original: '' },
    artists: [],
    karaoke: {},
  });
  
  const [artistFormData, setArtistFormData] = createSignal<ArtistFormData>({
    id: '',
    name: { original: '' },
    songs: [],
    songCount: 0,
  });

  // Load data on mount
  onMount(async () => {
    await loadSongs();
    await loadArtists();
  });

  // Auto-clear messages after 5 seconds
  createEffect(() => {
    if (success()) {
      setTimeout(() => setSuccess(null), 5000);
    }
  });

  createEffect(() => {
    if (error()) {
      setTimeout(() => setError(null), 5000);
    }
  });

  const loadSongs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/songs');
      const data = await response.json();
      if (response.ok) {
        setSongs(data.songs || []);
      } else {
        setError(data.error || 'Failed to load songs');
      }
    } catch (err) {
      setError('Failed to load songs');
    } finally {
      setLoading(false);
    }
  };

  const loadArtists = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/artists');
      const data = await response.json();
      if (response.ok) {
        setArtists(data.artists || []);
      } else {
        setError(data.error || 'Failed to load artists');
      }
    } catch (err) {
      setError('Failed to load artists');
    } finally {
      setLoading(false);
    }
  };

  const filteredSongs = () => {
    const query = songSearchQuery().toLowerCase();
    if (!query) return songs();
    return songs().filter(song => 
      song.id.toLowerCase().includes(query) ||
      song.title.original.toLowerCase().includes(query) ||
      song.artists.some(artistId => artistId.toLowerCase().includes(query))
    );
  };

  const filteredArtists = () => {
    const query = artistSearchQuery().toLowerCase();
    if (!query) return artists();
    return artists().filter(artist => 
      artist.id.toLowerCase().includes(query) ||
      artist.name.original.toLowerCase().includes(query)
    );
  };

  const resetSongForm = () => {
    setSongFormData({
      id: '',
      title: { original: '' },
      artists: [],
      karaoke: {},
    });
    setEditingSong(null);
    setShowSongForm(false);
  };

  const resetArtistForm = () => {
    setArtistFormData({
      id: '',
      name: { original: '' },
      songs: [],
      songCount: 0,
    });
    setEditingArtist(null);
    setShowArtistForm(false);
  };

  const handleEditSong = (song: Song) => {
    setSongFormData({
      id: song.id,
      title: song.title,
      artists: [...song.artists],
      karaoke: { ...song.karaoke },
      releaseDate: song.releaseDate || '',
      lyrics: song.lyrics || '',
    });
    setEditingSong(song);
    setShowSongForm(true);
  };

  const handleEditArtist = (artist: Artist) => {
    setArtistFormData({
      id: artist.id,
      name: artist.name,
      songs: artist.songs || [],
      songCount: artist.songCount || 0,
      debutDate: artist.debutDate || '',
    });
    setEditingArtist(artist);
    setShowArtistForm(true);
  };

  const handleSaveSong = async () => {
    try {
      setLoading(true);
      const data = songFormData();
      const method = editingSong() ? 'PUT' : 'POST';
      const response = await fetch('/api/songs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song: data }),
      });
      
      const result = await response.json();
      if (response.ok) {
        setSuccess(editingSong() ? 'Song updated successfully' : 'Song created successfully');
        resetSongForm();
        await loadSongs();
      } else {
        setError(result.error || 'Failed to save song');
      }
    } catch (err) {
      setError('Failed to save song');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArtist = async () => {
    try {
      setLoading(true);
      const data = artistFormData();
      const method = editingArtist() ? 'PUT' : 'POST';
      const response = await fetch('/api/artists', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artist: data }),
      });
      
      const result = await response.json();
      if (response.ok) {
        setSuccess(editingArtist() ? 'Artist updated successfully' : 'Artist created successfully');
        resetArtistForm();
        await loadArtists();
      } else {
        setError(result.error || 'Failed to save artist');
      }
    } catch (err) {
      setError('Failed to save artist');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    if (!confirm('Are you sure you want to delete this song?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/songs?id=${songId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (response.ok) {
        setSuccess('Song deleted successfully');
        await loadSongs();
      } else {
        setError(result.error || 'Failed to delete song');
      }
    } catch (err) {
      setError('Failed to delete song');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArtist = async (artistId: string) => {
    if (!confirm('Are you sure you want to delete this artist?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/artists?id=${artistId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      if (response.ok) {
        setSuccess('Artist deleted successfully');
        await loadArtists();
      } else {
        setError(result.error || 'Failed to delete artist');
      }
    } catch (err) {
      setError('Failed to delete artist');
    } finally {
      setLoading(false);
    }
  };

  const updateSongFormField = (field: string, value: any) => {
    setSongFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateArtistFormField = (field: string, value: any) => {
    setArtistFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const addArtistToSong = () => {
    const newArtist = prompt('Enter artist ID:');
    if (newArtist && newArtist.trim()) {
      setSongFormData(prev => ({
        ...prev,
        artists: [...prev.artists, newArtist.trim()],
      }));
    }
  };

  const removeArtistFromSong = (index: number) => {
    setSongFormData(prev => ({
      ...prev,
      artists: prev.artists.filter((_, i) => i !== index),
    }));
  };

  const addSongToArtist = () => {
    const newSong = prompt('Enter song ID:');
    if (newSong && newSong.trim()) {
      setArtistFormData(prev => ({
        ...prev,
        songs: [...prev.songs, newSong.trim()],
        songCount: prev.songs.length + 1,
      }));
    }
  };

  const removeSongFromArtist = (index: number) => {
    setArtistFormData(prev => ({
      ...prev,
      songs: prev.songs.filter((_, i) => i !== index),
      songCount: prev.songs.length - 1,
    }));
  };

  return (
    <div class={props.class}>
      {/* Messages */}
      <Show when={success()}>
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success()}
        </div>
      </Show>
      
      <Show when={error()}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error()}
        </div>
      </Show>

      {/* Tab Navigation */}
      <div class="flex border-b border-gray-200 mb-6">
        <button
          class={`px-4 py-2 font-medium text-sm ${
            activeTab() === 'songs'
              ? 'border-b-2 border-purple-500 text-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('songs')}
        >
          Songs ({songs().length})
        </button>
        <button
          class={`px-4 py-2 font-medium text-sm ${
            activeTab() === 'artists'
              ? 'border-b-2 border-purple-500 text-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('artists')}
        >
          Artists ({artists().length})
        </button>
      </div>

      {/* Songs Tab */}
      <Show when={activeTab() === 'songs'}>
        <div class="space-y-6">
          {/* Songs Header */}
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search songs..."
                value={songSearchQuery()}
                onInput={(e) => setSongSearchQuery(e.currentTarget.value)}
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span class="text-gray-500 text-sm">
                {filteredSongs().length} songs
              </span>
            </div>
            <button
              onClick={() => setShowSongForm(true)}
              class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Add Song
            </button>
          </div>

          {/* Songs List */}
          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Show when={loading()}>
              <div class="p-4 text-center text-gray-500">Loading...</div>
            </Show>
            
            <Show when={!loading() && filteredSongs().length === 0}>
              <div class="p-4 text-center text-gray-500">No songs found</div>
            </Show>
            
            <Show when={!loading() && filteredSongs().length > 0}>
              <div class="divide-y divide-gray-200">
                <For each={filteredSongs()}>
                  {(song) => (
                    <div class="p-4 hover:bg-gray-50">
                      <div class="flex justify-between items-start">
                        <div class="flex-1">
                          <h3 class="font-medium text-gray-900">{song.title.original}</h3>
                          <p class="text-sm text-gray-500">ID: {song.id}</p>
                          <p class="text-sm text-gray-500">Artists: {song.artists.join(', ')}</p>
                          <div class="flex space-x-2 mt-1">
                            <Show when={song.karaoke.tj}>
                              <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                TJ: {song.karaoke.tj}
                              </span>
                            </Show>
                            <Show when={song.karaoke.ky}>
                              <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                KY: {song.karaoke.ky}
                              </span>
                            </Show>
                            <Show when={song.karaoke.joysound}>
                              <span class="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                Joysound: {song.karaoke.joysound}
                              </span>
                            </Show>
                          </div>
                        </div>
                        <div class="flex space-x-2">
                          <button
                            onClick={() => handleEditSong(song)}
                            class="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteSong(song.id)}
                            class="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* Artists Tab */}
      <Show when={activeTab() === 'artists'}>
        <div class="space-y-6">
          {/* Artists Header */}
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search artists..."
                value={artistSearchQuery()}
                onInput={(e) => setArtistSearchQuery(e.currentTarget.value)}
                class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span class="text-gray-500 text-sm">
                {filteredArtists().length} artists
              </span>
            </div>
            <button
              onClick={() => setShowArtistForm(true)}
              class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Add Artist
            </button>
          </div>

          {/* Artists List */}
          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Show when={loading()}>
              <div class="p-4 text-center text-gray-500">Loading...</div>
            </Show>
            
            <Show when={!loading() && filteredArtists().length === 0}>
              <div class="p-4 text-center text-gray-500">No artists found</div>
            </Show>
            
            <Show when={!loading() && filteredArtists().length > 0}>
              <div class="divide-y divide-gray-200">
                <For each={filteredArtists()}>
                  {(artist) => (
                    <div class="p-4 hover:bg-gray-50">
                      <div class="flex justify-between items-start">
                        <div class="flex-1">
                          <h3 class="font-medium text-gray-900">{artist.name.original}</h3>
                          <p class="text-sm text-gray-500">ID: {artist.id}</p>
                          <p class="text-sm text-gray-500">Songs: {artist.songCount || 0}</p>
                          <Show when={artist.debutDate}>
                            <p class="text-sm text-gray-500">Debut: {artist.debutDate}</p>
                          </Show>
                        </div>
                        <div class="flex space-x-2">
                          <button
                            onClick={() => handleEditArtist(artist)}
                            class="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteArtist(artist.id)}
                            class="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </Show>

      {/* Song Form Modal */}
      <Show when={showSongForm()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold">
                {editingSong() ? 'Edit Song' : 'Add New Song'}
              </h2>
              <button
                onClick={resetSongForm}
                class="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Song ID *
                </label>
                <input
                  type="text"
                  value={songFormData().id}
                  onInput={(e) => updateSongFormField('id', e.currentTarget.value)}
                  class={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    editingSong() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                  placeholder="e.g., gurenge"
                  readonly={editingSong() !== null}
                  disabled={editingSong() !== null}
                />
                <Show when={editingSong()}>
                  <p class="text-xs text-gray-500 mt-1">
                    ID cannot be changed when editing an existing song
                  </p>
                </Show>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Original Title *
                </label>
                <input
                  type="text"
                  value={songFormData().title.original}
                  onInput={(e) => updateSongFormField('title', { ...songFormData().title, original: e.currentTarget.value })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., 紅蓮華"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Artists *
                </label>
                <div class="space-y-2">
                  <For each={songFormData().artists}>
                    {(artist, index) => (
                      <div class="flex items-center space-x-2">
                        <input
                          type="text"
                          value={artist}
                          onInput={(e) => {
                            const newArtists = [...songFormData().artists];
                            newArtists[index()] = e.currentTarget.value;
                            updateSongFormField('artists', newArtists);
                          }}
                          class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => removeArtistFromSong(index())}
                          class="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </For>
                  <button
                    onClick={addArtistToSong}
                    class="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Artist
                  </button>
                </div>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    TJ Karaoke ID
                  </label>
                  <input
                    type="text"
                    value={songFormData().karaoke.tj || ''}
                    onInput={(e) => updateSongFormField('karaoke', { ...songFormData().karaoke, tj: e.currentTarget.value })}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    KY Karaoke ID
                  </label>
                  <input
                    type="text"
                    value={songFormData().karaoke.ky || ''}
                    onInput={(e) => updateSongFormField('karaoke', { ...songFormData().karaoke, ky: e.currentTarget.value })}
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Release Date
                </label>
                <input
                  type="date"
                  value={songFormData().releaseDate || ''}
                  onInput={(e) => updateSongFormField('releaseDate', e.currentTarget.value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Lyrics
                </label>
                <textarea
                  value={songFormData().lyrics || ''}
                  onInput={(e) => updateSongFormField('lyrics', e.currentTarget.value)}
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 mt-6">
              <button
                onClick={resetSongForm}
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSong}
                disabled={loading()}
                class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {loading() ? 'Saving...' : (editingSong() ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Artist Form Modal */}
      <Show when={showArtistForm()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold">
                {editingArtist() ? 'Edit Artist' : 'Add New Artist'}
              </h2>
              <button
                onClick={resetArtistForm}
                class="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Artist ID *
                </label>
                <input
                  type="text"
                  value={artistFormData().id}
                  onInput={(e) => updateArtistFormField('id', e.currentTarget.value)}
                  class={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    editingArtist() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                  }`}
                  placeholder="e.g., lisa"
                  readonly={editingArtist() !== null}
                  disabled={editingArtist() !== null}
                />
                <Show when={editingArtist()}>
                  <p class="text-xs text-gray-500 mt-1">
                    ID cannot be changed when editing an existing artist
                  </p>
                </Show>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Original Name *
                </label>
                <input
                  type="text"
                  value={artistFormData().name.original}
                  onInput={(e) => updateArtistFormField('name', { ...artistFormData().name, original: e.currentTarget.value })}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., LiSA"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Songs
                </label>
                <div class="space-y-2">
                  <For each={artistFormData().songs}>
                    {(song, index) => (
                      <div class="flex items-center space-x-2">
                        <input
                          type="text"
                          value={song}
                          onInput={(e) => {
                            const newSongs = [...artistFormData().songs];
                            newSongs[index()] = e.currentTarget.value;
                            updateArtistFormField('songs', newSongs);
                            updateArtistFormField('songCount', newSongs.length);
                          }}
                          class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => removeSongFromArtist(index())}
                          class="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </For>
                  <button
                    onClick={addSongToArtist}
                    class="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Song
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Debut Date
                </label>
                <input
                  type="date"
                  value={artistFormData().debutDate || ''}
                  onInput={(e) => updateArtistFormField('debutDate', e.currentTarget.value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 mt-6">
              <button
                onClick={resetArtistForm}
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveArtist}
                disabled={loading()}
                class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {loading() ? 'Saving...' : (editingArtist() ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default AdminInterface; 
