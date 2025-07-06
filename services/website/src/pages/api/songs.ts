/// <reference types="astro/client" />
import type { APIRoute } from 'astro';
import type { Song } from '../../types/song';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';

// Only allow this endpoint in development
const isDev = process.env.NODE_ENV !== 'production';
if (!isDev) {
  throw new Error('API endpoints are only available in development mode');
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function getSongPath(songId: string, releaseYear?: string): string {
  // If release year is provided, use it; otherwise try to find the song
  if (releaseYear) {
    return resolve(`./public/data/songs/${releaseYear}/${songId}.json`);
  }

  // Search for the song in all year directories
  const songsBasePath = resolve('./public/data/songs');
  try {
    const yearDirectories = readdirSync(songsBasePath, { withFileTypes: true })
      .filter((dirent: any) => dirent.isDirectory())
      .map((dirent: any) => dirent.name);

    for (const year of yearDirectories) {
      const songPath = resolve(songsBasePath, year, `${songId}.json`);
      if (existsSync(songPath)) {
        return songPath;
      }
    }
  } catch (error) {
    console.warn('Failed to search for song:', error);
  }

  // Default to current year if not found
  const currentYear = new Date().getFullYear().toString();
  return resolve(`./public/data/songs/${currentYear}/${songId}.json`);
}

function loadSong(songId: string): Song | null {
  try {
    const songPath = getSongPath(songId);
    if (!existsSync(songPath)) {
      return null;
    }
    const songData = readFileSync(songPath, 'utf-8');
    return JSON.parse(songData);
  } catch (error) {
    console.error('Failed to load song:', error);
    return null;
  }
}

function saveSong(song: Song, releaseYear?: string): boolean {
  try {
    const year = releaseYear || new Date().getFullYear().toString();
    const songPath = getSongPath(song.id, year);
    const dirPath = dirname(songPath);

    // Ensure directory exists
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }

    // Save the song with proper formatting
    writeFileSync(songPath, JSON.stringify(song, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed to save song:', error);
    return false;
  }
}

function deleteSong(songId: string): boolean {
  try {
    const songPath = getSongPath(songId);
    if (!existsSync(songPath)) {
      return false;
    }

    unlinkSync(songPath);
    return true;
  } catch (error) {
    console.error('Failed to delete song:', error);
    return false;
  }
}

function validateSong(song: any): string[] {
  const errors: string[] = [];

  if (!song.id || typeof song.id !== 'string') {
    errors.push('Song ID is required and must be a string');
  }

  if (!song.title || typeof song.title !== 'object') {
    errors.push('Song title is required and must be an object');
  } else if (!song.title.original || typeof song.title.original !== 'string') {
    errors.push('Song title.original is required and must be a string');
  }

  if (!song.artists || !Array.isArray(song.artists)) {
    errors.push('Song artists is required and must be an array');
  } else if (song.artists.length === 0) {
    errors.push('Song must have at least one artist');
  }

  if (!song.karaoke || typeof song.karaoke !== 'object') {
    errors.push('Song karaoke is required and must be an object');
  }

  return errors;
}

// GET /api/songs?id=songId - Get a specific song
// GET /api/songs - Get all songs (limited for performance)
export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const songId = searchParams.get('id');

    if (songId) {
      // Get specific song
      const song = loadSong(songId);
      if (!song) {
        return new Response(JSON.stringify({ error: 'Song not found' }), {
          status: 404,
          headers: CORS_HEADERS,
        });
      }

      return new Response(JSON.stringify({ song }), { status: 200, headers: CORS_HEADERS });
    } else {
      // Get all songs (limited for performance)
      const songs: Song[] = [];
      const songsBasePath = resolve('./public/data/songs');

      try {
        const yearDirectories = readdirSync(songsBasePath, { withFileTypes: true })
          .filter((dirent: any) => dirent.isDirectory())
          .map((dirent: any) => dirent.name);

        for (const year of yearDirectories) {
          const yearPath = resolve(songsBasePath, year);
          const songFiles = readdirSync(yearPath, { withFileTypes: true })
            .filter((dirent: any) => dirent.isFile() && dirent.name.endsWith('.json'))
            .map((dirent: any) => dirent.name.replace('.json', ''));

          for (const songId of songFiles) {
            const song = loadSong(songId);
            if (song) {
              songs.push(song);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load songs:', error);
      }

      return new Response(JSON.stringify({ songs, count: songs.length }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    }
  } catch (error) {
    console.error('GET /api/songs error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

// POST /api/songs - Create a new song
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { song, releaseYear } = body;

    // Validate the song data
    const errors = validateSong(song);
    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', errors }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Check if song already exists
    const existingSong = loadSong(song.id);
    if (existingSong) {
      return new Response(JSON.stringify({ error: 'Song already exists' }), {
        status: 409,
        headers: CORS_HEADERS,
      });
    }

    // Save the song
    const success = saveSong(song, releaseYear);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to save song' }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ message: 'Song created successfully', song }), {
      status: 201,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('POST /api/songs error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

// PUT /api/songs - Update an existing song
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { song, releaseYear } = body;

    // Validate the song data
    const errors = validateSong(song);
    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', errors }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Check if song exists
    const existingSong = loadSong(song.id);
    if (!existingSong) {
      return new Response(JSON.stringify({ error: 'Song not found' }), {
        status: 404,
        headers: CORS_HEADERS,
      });
    }

    // Prevent ID changes - ensure the ID matches the existing song
    if (song.id !== existingSong.id) {
      return new Response(
        JSON.stringify({ error: 'Song ID cannot be changed. ID must remain: ' + existingSong.id }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Save the updated song
    const success = saveSong(song, releaseYear);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to update song' }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ message: 'Song updated successfully', song }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('PUT /api/songs error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

// DELETE /api/songs?id=songId - Delete a song
export const DELETE: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const songId = searchParams.get('id');

    if (!songId) {
      return new Response(JSON.stringify({ error: 'Song ID is required' }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Check if song exists
    const existingSong = loadSong(songId);
    if (!existingSong) {
      return new Response(JSON.stringify({ error: 'Song not found' }), {
        status: 404,
        headers: CORS_HEADERS,
      });
    }

    // Delete the song
    const success = deleteSong(songId);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Failed to delete song' }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ message: 'Song deleted successfully' }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('DELETE /api/songs error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
};
