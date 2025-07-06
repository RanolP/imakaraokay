/// <reference types="astro/client" />
import type { APIRoute } from 'astro';

// Only allow this endpoint in development
const isDev = process.env.NODE_ENV !== 'production';
if (!isDev) {
  throw new Error('API endpoints are only available in development mode');
}

export const GET: APIRoute = async ({ url }) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  const searchParams = new URL(url).searchParams;
  const message = searchParams.get('message') || 'Hello from API!';

  const response = {
    message,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    status: 'working',
  };

  return new Response(JSON.stringify(response, null, 2), { status: 200, headers });
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
