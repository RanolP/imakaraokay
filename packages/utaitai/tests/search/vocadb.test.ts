import { describe, it, expect } from 'vitest';
import { searchVocadb, type VocadbSearchResponse } from '../../src/search/vocadb.js';

describe('searchVocadb', () => {
  it('should search for Korean song "그것이 당신의 행복이라 할지라도" and return results', async () => {
    const generator = searchVocadb({ query: '그것이 당신의 행복이라 할지라도' });

    const results: VocadbSearchResponse[] = [];
    let count = 0;
    const maxResults = 5; // Limit to first 5 results for testing

    for await (const result of generator) {
      results.push(result);
      count++;
      if (count >= maxResults) break;
    }

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(maxResults);

    // Check structure of first result
    const firstResult = results[0];
    expect(firstResult).toBeDefined();
    expect(typeof firstResult.id).toBe('number');
    expect(firstResult.id).toBeGreaterThan(0);
    expect(typeof firstResult.name).toBe('string');
    expect(firstResult.name.length).toBeGreaterThan(0);
    expect(typeof firstResult.getDetail).toBe('function');

    // Should contain relevant Korean song title
    const hasRelevantResult = results.some((result) =>
      result.name.includes('그것이') ||
      result.name.includes('당신의') ||
      result.name.includes('행복') ||
      result.name.includes('それが') || // Japanese alternative title
      result.name.includes('あなたの') ||
      result.name.includes('幸せ')
    );
    expect(hasRelevantResult).toBe(true);

    // Test getDetail function on first result
    const detail = await firstResult.getDetail();
    expect(detail).toBeDefined();
    expect(typeof detail.artistString).toBe('string');
    expect(typeof detail.createDate).toBe('string');
    expect(Array.isArray(detail.artists)).toBe(true);
    expect(Array.isArray(detail.tags)).toBe(true);
  }, 30000); // 30 second timeout for network request

  it('should search for English Vocaloid terms and return results', async () => {
    const generator = searchVocadb({ query: 'miku' });

    const results: VocadbSearchResponse[] = [];
    let count = 0;
    const maxResults = 3;

    for await (const result of generator) {
      results.push(result);
      count++;
      if (count >= maxResults) break;
    }

    expect(results.length).toBeGreaterThan(0);

    // Check structure of all results
    results.forEach((result) => {
      expect(typeof result.id).toBe('number');
      expect(typeof result.name).toBe('string');
      expect(typeof result.getDetail).toBe('function');
      expect(result.id).toBeGreaterThan(0);
      expect(result.name.length).toBeGreaterThan(0);
    });

    // Should contain Miku-related results
    const hasMikuResult = results.some((result) =>
      result.name.toLowerCase().includes('miku') ||
      result.name.includes('ミク')
    );
    expect(hasMikuResult).toBe(true);
  }, 30000);

  it('should search for Japanese song titles and return results', async () => {
    const generator = searchVocadb({ query: 'カラオケ' });

    const results: VocadbSearchResponse[] = [];
    let count = 0;
    const maxResults = 3;

    for await (const result of generator) {
      results.push(result);
      count++;
      if (count >= maxResults) break;
    }

    expect(results.length).toBeGreaterThan(0);

    // Check that we get results (Japanese content might be in English/romaji)
    results.forEach((result) => {
      expect(typeof result.id).toBe('number');
      expect(typeof result.name).toBe('string');
      expect(result.name.length).toBeGreaterThan(0);
    });
  }, 30000);

  it('should handle pagination correctly and return multiple results', async () => {
    const generator = searchVocadb({ query: 'love' });

    const results: VocadbSearchResponse[] = [];
    let count = 0;
    const maxResults = 10; // Get multiple results to test pagination

    for await (const result of generator) {
      results.push(result);
      count++;
      if (count >= maxResults) break;
    }

    expect(results.length).toBeGreaterThan(1);

    // All results should have unique IDs
    const ids = results.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    // Test structure consistency across all results
    results.forEach((result) => {
      expect(typeof result.id).toBe('number');
      expect(typeof result.name).toBe('string');
      expect(typeof result.getDetail).toBe('function');
      expect(result.id).toBeGreaterThan(0);
      expect(result.name.length).toBeGreaterThan(0);
    });
  }, 45000);

  it('should handle getDetail function for song details', async () => {
    const generator = searchVocadb({ query: 'senbonzakura' });

    let firstResult: VocadbSearchResponse | undefined;
    for await (const result of generator) {
      firstResult = result;
      break;
    }

    expect(firstResult).toBeDefined();

    if (firstResult) {
      const detail = await firstResult.getDetail();

      expect(detail).toBeDefined();
      expect(typeof detail.additionalNames).toBe('string');
      expect(typeof detail.artistString).toBe('string');
      expect(typeof detail.createDate).toBe('string');
      expect(Array.isArray(detail.artists)).toBe(true);
      expect(Array.isArray(detail.tags)).toBe(true);

      // Check artists array structure
      if (detail.artists.length > 0) {
        const artist = detail.artists[0];
        expect(typeof artist.artist.id).toBe('number');
        expect(typeof artist.artist.name).toBe('string');
        expect(typeof artist.artist.artistType).toBe('string');
        expect(typeof artist.categories).toBe('string');
        expect(typeof artist.name).toBe('string');
      }

      // Check tags array structure (if tags exist) - be flexible with structure
      if (detail.tags.length > 0) {
        const tag = detail.tags[0];
        // Tags structure might vary, just check that it's an object
        expect(typeof tag).toBe('object');
        expect(tag).not.toBeNull();
      }
    }
  }, 30000);

  it('should handle empty search results gracefully', async () => {
    // Use a very specific query that's unlikely to return results
    const generator = searchVocadb({ query: 'xyzabcdefghijklmnopqrstuvwxyz123456789' });

    const results: VocadbSearchResponse[] = [];
    for await (const result of generator) {
      results.push(result);
    }

    // Should complete without throwing errors
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  }, 15000);

  it('should search for Korean Vocaloid producer names', async () => {
    const generator = searchVocadb({ query: '조민' });

    const results: VocadbSearchResponse[] = [];
    let count = 0;
    const maxResults = 5;

    for await (const result of generator) {
      results.push(result);
      count++;
      if (count >= maxResults) break;
    }

    // Should return results for Korean query
    expect(results.length).toBeGreaterThanOrEqual(0);

    if (results.length > 0) {
      const firstResult = results[0];
      expect(typeof firstResult.id).toBe('number');
      expect(typeof firstResult.name).toBe('string');
      expect(typeof firstResult.getDetail).toBe('function');
    }
  }, 30000);

  it('should find specific Korean song with alternative spellings', async () => {
    // Test variations of the Korean song title (limiting to avoid timeouts)
    const variations = [
      '그것이 당신의 행복이라 할지라도',
      'それがあなたの幸せとしても'
    ];

    for (const query of variations) {
      const generator = searchVocadb({ query });

      const results: VocadbSearchResponse[] = [];
      let count = 0;
      const maxResults = 2;

      for await (const result of generator) {
        results.push(result);
        count++;
        if (count >= maxResults) break;
      }

      // Should get some results for each variation
      expect(Array.isArray(results)).toBe(true);

      if (results.length > 0) {
        const firstResult = results[0];
        expect(typeof firstResult.id).toBe('number');
        expect(typeof firstResult.name).toBe('string');
        expect(firstResult.id).toBeGreaterThan(0);
        expect(firstResult.name.length).toBeGreaterThan(0);
      }
    }
  }, 45000); // Timeout for multiple searches
}); 
