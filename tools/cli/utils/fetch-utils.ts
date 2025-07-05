import { fetch } from 'undici';

export interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export async function safeFetch(url: string, options?: FetchOptions) {
  try {
    const { timeout, ...fetchOptions } = options || {};
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate',
        ...fetchOptions?.headers,
      },
      // Note: undici supports timeout but TypeScript types might not reflect it
    } as any);
    return response;
  } catch (error) {
    throw new Error(`Fetch failed for ${url}: ${error}`);
  }
} 
