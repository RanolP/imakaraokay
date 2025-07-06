/// <reference types="astro/client" />
import type { APIRoute } from 'astro';
import type { Artist } from '../../types/song';
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

function getArtistPath(artistId: string, debutYear?: string): string {
  // If debut year is provided, use it; otherwise try to find the artist
  if (debutYear) {
    return resolve(`./public/data/artists/${debutYear}/${artistId}.json`);
  }
  
  // Search for the artist in all year directories
  const artistsBasePath = resolve('./public/data/artists');
  try {
    const yearDirectories = readdirSync(artistsBasePath, { withFileTypes: true })
      .filter((dirent: any) => dirent.isDirectory())
      .map((dirent: any) => dirent.name);

    for (const year of yearDirectories) {
      const artistPath = resolve(artistsBasePath, year, `${artistId}.json`);
      if (existsSync(artistPath)) {
        return artistPath;
      }
    }
  } catch (error) {
    console.warn('Failed to search for artist:', error);
  }
  
  // Default to current year if not found
  const currentYear = new Date().getFullYear().toString();
  return resolve(`./public/data/artists/${currentYear}/${artistId}.json`);
}

function loadArtist(artistId: string): Artist | null {
  try {
    const artistPath = getArtistPath(artistId);
    if (!existsSync(artistPath)) {
      return null;
    }
    const artistData = readFileSync(artistPath, 'utf-8');
    return JSON.parse(artistData);
  } catch (error) {
    console.error('Failed to load artist:', error);
    return null;
  }
}

function saveArtist(artist: Artist, debutYear?: string): boolean {
  try {
    const year = debutYear || new Date().getFullYear().toString();
    const artistPath = getArtistPath(artist.id, year);
    const dirPath = dirname(artistPath);
    
    // Ensure directory exists
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
    
    // Save the artist with proper formatting
    writeFileSync(artistPath, JSON.stringify(artist, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Failed to save artist:', error);
    return false;
  }
}

function deleteArtist(artistId: string): boolean {
  try {
    const artistPath = getArtistPath(artistId);
    if (!existsSync(artistPath)) {
      return false;
    }
    
    unlinkSync(artistPath);
    return true;
  } catch (error) {
    console.error('Failed to delete artist:', error);
    return false;
  }
}

function validateArtist(artist: any): string[] {
  const errors: string[] = [];
  
  if (!artist.id || typeof artist.id !== 'string') {
    errors.push('Artist ID is required and must be a string');
  }
  
  if (!artist.name || typeof artist.name !== 'object') {
    errors.push('Artist name is required and must be an object');
  } else if (!artist.name.original || typeof artist.name.original !== 'string') {
    errors.push('Artist name.original is required and must be a string');
  }
  
  if (!artist.songs || !Array.isArray(artist.songs)) {
    errors.push('Artist songs is required and must be an array');
  }
  
  if (artist.songCount !== undefined && typeof artist.songCount !== 'number') {
    errors.push('Artist songCount must be a number');
  }
  
  return errors;
}

// GET /api/artists?id=artistId - Get a specific artist
// GET /api/artists - Get all artists (limited for performance)
export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const artistId = searchParams.get('id');
    
    if (artistId) {
      // Get specific artist
      const artist = loadArtist(artistId);
      if (!artist) {
        return new Response(
          JSON.stringify({ error: 'Artist not found' }),
          { status: 404, headers: CORS_HEADERS }
        );
      }
      
      return new Response(
        JSON.stringify({ artist }),
        { status: 200, headers: CORS_HEADERS }
      );
    } else {
      // Get all artists (limited for performance)
      const artists: Artist[] = [];
      const artistsBasePath = resolve('./public/data/artists');
      
      try {
        const yearDirectories = readdirSync(artistsBasePath, { withFileTypes: true })
          .filter((dirent: any) => dirent.isDirectory())
          .map((dirent: any) => dirent.name);

        for (const year of yearDirectories) {
          const yearPath = resolve(artistsBasePath, year);
          const artistFiles = readdirSync(yearPath, { withFileTypes: true })
            .filter((dirent: any) => dirent.isFile() && dirent.name.endsWith('.json'))
            .map((dirent: any) => dirent.name.replace('.json', ''));

          for (const artistId of artistFiles) {
            const artist = loadArtist(artistId);
            if (artist) {
              artists.push(artist);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load artists:', error);
      }
      
      return new Response(
        JSON.stringify({ artists, count: artists.length }),
        { status: 200, headers: CORS_HEADERS }
      );
    }
  } catch (error) {
    console.error('GET /api/artists error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

// POST /api/artists - Create a new artist
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { artist, debutYear } = body;
    
    // Validate the artist data
    const errors = validateArtist(artist);
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', errors }),
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    // Check if artist already exists
    const existingArtist = loadArtist(artist.id);
    if (existingArtist) {
      return new Response(
        JSON.stringify({ error: 'Artist already exists' }),
        { status: 409, headers: CORS_HEADERS }
      );
    }
    
    // Save the artist
    const success = saveArtist(artist, debutYear);
    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Failed to save artist' }),
        { status: 500, headers: CORS_HEADERS }
      );
    }
    
    return new Response(
      JSON.stringify({ message: 'Artist created successfully', artist }),
      { status: 201, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('POST /api/artists error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

// PUT /api/artists - Update an existing artist
export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { artist, debutYear } = body;
    
    // Validate the artist data
    const errors = validateArtist(artist);
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', errors }),
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    // Check if artist exists
    const existingArtist = loadArtist(artist.id);
    if (!existingArtist) {
      return new Response(
        JSON.stringify({ error: 'Artist not found' }),
        { status: 404, headers: CORS_HEADERS }
      );
    }
    
    // Prevent ID changes - ensure the ID matches the existing artist
    if (artist.id !== existingArtist.id) {
      return new Response(
        JSON.stringify({ error: 'Artist ID cannot be changed. ID must remain: ' + existingArtist.id }),
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    // Save the updated artist
    const success = saveArtist(artist, debutYear);
    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Failed to update artist' }),
        { status: 500, headers: CORS_HEADERS }
      );
    }
    
    return new Response(
      JSON.stringify({ message: 'Artist updated successfully', artist }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('PUT /api/artists error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

// DELETE /api/artists?id=artistId - Delete an artist
export const DELETE: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const artistId = searchParams.get('id');
    
    if (!artistId) {
      return new Response(
        JSON.stringify({ error: 'Artist ID is required' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    // Check if artist exists
    const existingArtist = loadArtist(artistId);
    if (!existingArtist) {
      return new Response(
        JSON.stringify({ error: 'Artist not found' }),
        { status: 404, headers: CORS_HEADERS }
      );
    }
    
    // Delete the artist
    const success = deleteArtist(artistId);
    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete artist' }),
        { status: 500, headers: CORS_HEADERS }
      );
    }
    
    return new Response(
      JSON.stringify({ message: 'Artist deleted successfully' }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error('DELETE /api/artists error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}; 
