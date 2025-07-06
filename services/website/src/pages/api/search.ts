/// <reference types="astro/client" />
import type { APIRoute } from 'astro';
import {
  TJKaraokeProvider,
  KYKaraokeProvider,
  VocaroProvider,
  MusixMatchProvider,
  Logger,
  SearchEngine,
} from '@imakaraokay/shared';

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
          usage:
            'GET /api/search?query=<search_term>&providers=<tj,ky,vocaro,musixmatch>&limit=<number>',
        }),
        { status: 400, headers }
      );
    }

    // Parse parameters
    const providers = providersParam
      ? providersParam.split(',')
      : ['tj', 'ky', 'vocaro', 'musixmatch'];
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    // Initialize logger
    const logger = new Logger();

    // Initialize search engine with selected providers
    const searchEngine = new SearchEngine(logger);

    // Add requested karaoke providers
    if (providers.includes('tj')) {
      searchEngine.addKaraokeProvider(new TJKaraokeProvider(logger));
    }
    if (providers.includes('ky')) {
      searchEngine.addKaraokeProvider(new KYKaraokeProvider(logger));
    }

    // Add requested lyrics providers
    if (providers.includes('vocaro')) {
      searchEngine.addLyricsProvider(new VocaroProvider(logger));
    }
    if (providers.includes('musixmatch')) {
      searchEngine.addLyricsProvider(new MusixMatchProvider(logger));
    }

    // Perform search
    logger.log(`API: Searching for "${query}" with providers: ${providers.join(', ')}`);
    const searchResults = await searchEngine.search(query);

    // Apply limit to results
    const limitedResults = {
      karaoke: searchResults.karaoke.slice(0, limit),
      lyrics: searchResults.lyrics.slice(0, limit),
    };

    // Format response
    const response = {
      query,
      providers,
      limit,
      results: limitedResults,
      total: {
        karaoke: searchResults.karaoke.length,
        lyrics: searchResults.lyrics.length,
      },
      returned: {
        karaoke: limitedResults.karaoke.length,
        lyrics: limitedResults.lyrics.length,
      },
      timestamp: new Date().toISOString(),
    };

    logger.log(
      `API: Found ${searchResults.karaoke.length} karaoke results and ${searchResults.lyrics.length} lyrics results`
    );

    return new Response(JSON.stringify(response, null, 2), { status: 200, headers });
  } catch (error) {
    console.error('API Search Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
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
