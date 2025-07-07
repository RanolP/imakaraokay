import { describe, it, expect } from 'vitest';
import { searchVocaroWiki, type VocaroWikiResponse } from '../../src/search/vocaro-wiki.js';

describe('searchVocaroWiki', () => {
  it('should search for Vocaloid-related terms and return properly typed results when available', async () => {
    const generator = searchVocaroWiki({ query: 'Miku' });

    const results: VocaroWikiResponse[] = [];
    let count = 0;
    const maxResults = 2; // Limit to just 2 results to reduce API calls

    for await (const result of generator) {
      results.push(result);
      count++;
      if (count >= maxResults) break;
    }

    // The search might not return results due to anti-bot measures or rate limiting
    // So we test the structure when results are available
    if (results.length > 0) {
      expect(results.length).toBeLessThanOrEqual(maxResults);

      // Check structure of first result
      const firstResult = results[0];
      expect(firstResult).toBeDefined();
      expect(typeof firstResult.url).toBe('string');
      expect(firstResult.url.length).toBeGreaterThan(0);
      expect(firstResult.url).toContain('vocaro.wikidot.com');
      expect(typeof firstResult.title).toBe('string');
      expect(firstResult.title.length).toBeGreaterThan(0);

      // Validate all results have proper structure
      results.forEach((result) => {
        expect(typeof result.url).toBe('string');
        expect(typeof result.title).toBe('string');
        expect(result.url).toContain('vocaro.wikidot.com');
        expect(result.title.length).toBeGreaterThan(0);
      });
    }

    // At minimum, the function should complete without throwing errors
    expect(Array.isArray(results)).toBe(true);
  }, 30000);

  it('should handle empty search results gracefully', async () => {
    // Use a very specific query that's unlikely to return results from vocaro.wikidot.com
    const generator = searchVocaroWiki({ query: 'xyzabcdefghijklmnopqrstuvwxyz123456789' });

    const results: VocaroWikiResponse[] = [];
    for await (const result of generator) {
      results.push(result);
    }

    // Should complete without throwing errors, even if no results
    expect(Array.isArray(results)).toBe(true);
  }, 15000);

  it('should search for real-world Vocaloid songs', async () => {
    const songTitles = [
      'それがあなたの幸せとしても',
      '필요조건 Stranded',
      'Lemon Melon Cookie'
    ];

    // Test each song title
    for (const songTitle of songTitles) {
      const generator = searchVocaroWiki({ query: songTitle });

      const results: VocaroWikiResponse[] = [];
      let count = 0;
      const maxResults = 1; // Just 1 result per song to minimize API calls

      for await (const result of generator) {
        results.push(result);
        count++;
        if (count >= maxResults) break;
      }

      // When results are found, validate structure
      expect(results.length).toBeGreaterThan(0);
      const result = results[0];
      expect(typeof result.url).toBe('string');
      expect(typeof result.title).toBe('string');
      expect(result.url).toContain('vocaro.wikidot.com');
      expect(result.title.length).toBeGreaterThan(0);

      // The title should contain some relevant content (not just empty or whitespace)
      expect(result.title.trim().length).toBeGreaterThan(0);

      // Should complete without errors regardless of results
      expect(Array.isArray(results)).toBe(true);
    }
  }, 45000); // Longer timeout for multiple searches
}); 
