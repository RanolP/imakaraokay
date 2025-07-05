/// <reference types="astro/client" />
import type { APIRoute } from 'astro';

// Only allow this endpoint in development
const isDev = process.env.NODE_ENV !== 'production';
if (!isDev) {
  throw new Error('API endpoints are only available in development mode');
}

interface SearchParams {
  query: string;
  providers?: string[];
  limit?: number;
}

export const GET: APIRoute = async ({ url, request }) => {
  // CORS headers for development
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    // Parse query parameters
    const searchParams = new URL(url).searchParams;
    const query = searchParams.get('query');
    const providersParam = searchParams.get('providers');
    const limitParam = searchParams.get('limit');

    if (!query) {
      return new Response(
        JSON.stringify({ 
          error: 'Query parameter is required',
          usage: 'GET /api/search-simple?query=<search_term>&providers=<tj,ky,vocaro>&limit=<number>'
        }), 
        { status: 400, headers }
      );
    }

    // Parse parameters
    const providers = providersParam ? providersParam.split(',') : ['tj', 'ky', 'vocaro'];
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Mock search results for testing
    const mockResults = {
      karaoke: [
        { id: '12345', title: `Test Song for ${query}`, artist: 'Test Artist', source: 'TJ' as const },
        { id: '67890', title: `Another ${query} Song`, artist: 'Another Artist', source: 'KY' as const }
      ],
      lyrics: [
        { title: `${query} Lyrics`, artist: 'Lyrics Artist', url: 'http://example.com', source: 'Vocaro' as const }
      ]
    };

    // Apply limit to results
    const limitedResults = {
      karaoke: mockResults.karaoke.slice(0, limit),
      lyrics: mockResults.lyrics.slice(0, limit)
    };

    // Format response
    const response = {
      query,
      providers,
      limit,
      results: limitedResults,
      total: {
        karaoke: mockResults.karaoke.length,
        lyrics: mockResults.lyrics.length
      },
      returned: {
        karaoke: limitedResults.karaoke.length,
        lyrics: limitedResults.lyrics.length
      },
      note: "This is a mock API endpoint for testing. Real search functionality requires CLI integration.",
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(response, null, 2),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('API Search Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers }
    );
  }
};

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}; 
