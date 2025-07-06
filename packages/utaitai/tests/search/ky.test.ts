import { describe, it, expect } from 'vitest';
import { searchKY, type KyResponse } from '../../src/search/ky.js';

describe('searchKY', () => {
  it('should search for Korean songs and return results', async () => {
    const generator = searchKY({ query: '사랑' });

    const results: KyResponse[] = [];
    let count = 0;
    const maxResults = 3; // Limit to first 3 results for testing

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
    expect(typeof firstResult.title).toBe('string');
    expect(firstResult.title.length).toBeGreaterThan(0);
    expect(typeof firstResult.singer).toBe('string');
    expect(firstResult.singer.length).toBeGreaterThan(0);

    // Check optional fields
    expect(typeof firstResult.lyricCont).toBe('string');
    expect(typeof firstResult.composer).toBe('string');
    expect(typeof firstResult.lyricist).toBe('string');
    expect(typeof firstResult.releaseDate).toBe('string');

    // YouTube link is optional
    if (firstResult.youtube) {
      expect(typeof firstResult.youtube).toBe('string');
    }
  }, 30000); // 30 second timeout for network request

  it('should handle empty search results gracefully', async () => {
    // Use a very specific query that's unlikely to return results
    const generator = searchKY({ query: 'xyzabcdefghijklmnopqrstuvwxyz123456789' });

    const results: KyResponse[] = [];
    for await (const result of generator) {
      results.push(result);
    }

    // Should complete without throwing errors
    expect(results.length).toBe(0);
  }, 15000);

  it('should handle English search terms', async () => {
    const generator = searchKY({ query: 'love' });

    const results: KyResponse[] = [];
    let count = 0;
    const maxResults = 2;

    for await (const result of generator) {
      results.push(result);
      count++;
      if (count >= maxResults) break;
    }

    // Should return some results for common English word
    expect(results.length).toBeGreaterThan(0);

    if (results.length > 0) {
      const firstResult = results[0];
      expect(typeof firstResult.id).toBe('number');
      expect(typeof firstResult.title).toBe('string');
      expect(typeof firstResult.singer).toBe('string');
    }
  }, 30000);

  it('should return results with proper ID format', async () => {
    const generator = searchKY({ query: '노래' });

    let count = 0;
    for await (const result of generator) {
      // KY song IDs should be positive numbers
      expect(typeof result.id).toBe('number');
      expect(result.id).toBeGreaterThan(0);
      expect(Number.isInteger(result.id)).toBe(true);

      count++;
      if (count >= 2) break; // Test first 2 results
    }

    expect(count).toBeGreaterThan(0);
  }, 30000);

  it('should handle pagination correctly', async () => {
    const generator = searchKY({ query: '사랑' });

    const results: KyResponse[] = [];
    let count = 0;
    const maxResults = 20; // Get more than one page to test pagination

    for await (const result of generator) {
      results.push(result);
      count++;
      if (count >= maxResults) break;
    }

    // Should get results from multiple pages
    expect(results.length).toBeGreaterThan(10);

    // All results should have unique IDs
    const ids = results.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  }, 45000); // Longer timeout for multiple pages

  it('should return results with proper field types', async () => {
    const generator = searchKY({ query: '가요' });

    let count = 0;
    for await (const result of generator) {
      // Validate all required fields
      expect(typeof result.id).toBe('number');
      expect(typeof result.title).toBe('string');
      expect(typeof result.lyricCont).toBe('string');
      expect(typeof result.singer).toBe('string');
      expect(typeof result.composer).toBe('string');
      expect(typeof result.lyricist).toBe('string');
      expect(typeof result.releaseDate).toBe('string');

      // YouTube is optional
      if (result.youtube !== undefined) {
        expect(typeof result.youtube).toBe('string');
      }

      count++;
      if (count >= 3) break;
    }

    expect(count).toBeGreaterThan(0);
  }, 30000);

  it('should find songs with lyrics content', async () => {
    const generator = searchKY({ query: '봄날' });

    const results: KyResponse[] = [];
    let count = 0;
    const maxResults = 5;

    for await (const result of generator) {
      results.push(result);
      count++;
      if (count >= maxResults) break;
    }

    expect(results.length).toBeGreaterThan(0);

    // At least some results should have lyrics content
    const resultsWithLyrics = results.filter((r) => r.lyricCont && r.lyricCont.length > 0);
    expect(resultsWithLyrics.length).toBeGreaterThan(0);
  }, 30000);

  it('should handle Korean artist names correctly', async () => {
    const generator = searchKY({ query: 'IU' });

    const results: KyResponse[] = [];
    let count = 0;
    const maxResults = 3;

    for await (const result of generator) {
      results.push(result);
      count++;
      if (count >= maxResults) break;
    }

    expect(results.length).toBeGreaterThan(0);

    // Check that we get results with proper Korean encoding
    const firstResult = results[0];
    expect(firstResult.title).toBeDefined();
    expect(firstResult.singer).toBeDefined();

    // Should not have encoding issues (no question marks or broken characters)
    expect(firstResult.title).not.toContain('?');
    expect(firstResult.singer).not.toContain('?');
  }, 30000);

  it('should find specific Japanese song - テトリス by 柊マグネタイト', async () => {
    const generator = searchKY({ query: 'テトリス' });

    const results: KyResponse[] = [];
    let targetSong: KyResponse | undefined;

    // Search through results to find the specific song
    for await (const result of generator) {
      results.push(result);

      // Check if this is the target song (ID 57806 by 柊マグネタイト)
      if (result.id === 57806 && result.composer && result.composer.includes('柊マグネタイト')) {
        targetSong = result;
        break;
      }

      // Limit search to avoid infinite loop
      if (results.length >= 50) break;
    }

    // Should find the specific song
    expect(targetSong).toBeDefined();
    if (!targetSong) {
      throw new Error('Target song not found');
    }

    expect(targetSong.id).toBe(57806);
    expect(targetSong.composer).toBeDefined();
    expect(targetSong.composer).toContain('柊マグネタイト');

    // Check that title contains テトリス
    expect(targetSong.title).toContain('テトリス');

    // Validate structure
    expect(typeof targetSong.title).toBe('string');
    expect(targetSong.title.length).toBeGreaterThan(0);
    expect(typeof targetSong.singer).toBe('string');
    expect(targetSong.singer.length).toBeGreaterThan(0);
    expect(typeof targetSong.composer).toBe('string');
    expect(targetSong.composer.length).toBeGreaterThan(0);
  }, 60000); // Longer timeout for specific search
});
