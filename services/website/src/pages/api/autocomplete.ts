/// <reference types="astro/client" />
import type { APIRoute } from 'astro';

// Only allow this endpoint in development
const isDev = process.env.NODE_ENV !== 'production';
if (!isDev) {
  throw new Error('API endpoints are only available in development mode');
}

async function fetchYouTubeAutocomplete(query: string, client: string = 'firefox', ds: string = 'yt'): Promise<any> {
  const params = new URLSearchParams({
    client,
    ds,
    q: query
  });
  
  const url = `http://suggestqueries.google.com/complete/search?${params.toString()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // Try to parse as JSON directly first
    try {
      return JSON.parse(text);
    } catch {
      // If that fails, try to extract JSON from JSONP format
      const jsonMatch = text.match(/\[.*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('YouTube autocomplete fetch error:', error);
    throw error;
  }
}

export const GET: APIRoute = async ({ url }) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  try {
    const q = url.searchParams.get('q') || '';
    const client = url.searchParams.get('client') || 'firefox';
    const ds = url.searchParams.get('ds') || 'yt';
    
    const query = decodeURIComponent(q);

    if (!query.trim()) {
      const emptyResponse = [query, [], [], {}];
      return new Response(JSON.stringify(emptyResponse), { headers });
    }

    // Fetch suggestions from YouTube autocomplete API
    const suggestions = await fetchYouTubeAutocomplete(query, client, ds);
    
    return new Response(JSON.stringify(suggestions), { headers });

  } catch (error) {
    console.error('Autocomplete API error:', error);
    
    const errorResponse = [
      url.searchParams.get('q') || '',
      [],
      [],
      { error: error instanceof Error ? error.message : 'Unknown error' }
    ];

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers
    });
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}; 
