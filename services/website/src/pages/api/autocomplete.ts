/// <reference types="astro/client" />
import type { APIRoute } from 'astro';
import { SearchEngine } from '@imakaraokay/shared/search';
import { YouTubeAutocompleteProvider, Logger } from '@imakaraokay/shared';

// Only allow this endpoint in development
const isDev = process.env.NODE_ENV !== 'production';
if (!isDev) {
  throw new Error('API endpoints are only available in development mode');
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
    const query = decodeURIComponent(q);

    if (!query.trim()) {
      const emptyResponse = [query, [], [], {}];
      return new Response(JSON.stringify(emptyResponse), { headers });
    }

    // Initialize logger and search engine
    const logger = new Logger();
    const searchEngine = new SearchEngine(logger);
    
    // Add YouTube autocomplete provider
    const youtubeProvider = new YouTubeAutocompleteProvider(logger);
    searchEngine.addAutocompleteProvider(youtubeProvider);

    // Get autocomplete suggestions
    const autocompleteResults = await searchEngine.getAutocompleteSuggestions(query);
    
    // Convert to YouTube autocomplete API format for compatibility
    const suggestions = autocompleteResults.suggestions.map(result => result.suggestion);
    const response = [query, suggestions, [], {}];
    
    return new Response(JSON.stringify(response), { headers });

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
