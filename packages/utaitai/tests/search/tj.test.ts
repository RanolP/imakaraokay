import { describe, it, expect } from 'vitest';
import { searchTJ, type TjResponse } from '../../src/search/tj.js';

describe('searchTJ', () => {
  it('should search for Korean songs and return results', async () => {
    const generator = searchTJ({ query: '사랑' });

    const results: TjResponse[] = [];
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
    expect(Array.isArray(firstResult.title)).toBe(true);
    expect(firstResult.title.length).toBeGreaterThan(0);
    expect(typeof firstResult.singer).toBe('string');
    expect(firstResult.singer.length).toBeGreaterThan(0);

    // Check title structure
    for (const titlePart of firstResult.title) {
      expect(typeof titlePart.content).toBe('string');
      expect(typeof titlePart.highlight).toBe('boolean');
    }

    // Optional fields should be present but may be empty
    expect(firstResult.tags).toBeDefined();
    expect(Array.isArray(firstResult.tags)).toBe(true);
    expect(typeof firstResult.lyricist).toBe('string');
    expect(typeof firstResult.composer).toBe('string');
    expect(typeof firstResult.youtube).toBe('string');
  }, 30000); // 30 second timeout for network request

  it('should handle empty search results gracefully', async () => {
    // Use a very specific query that's unlikely to return results
    const generator = searchTJ({ query: 'xyzabcdefghijklmnopqrstuvwxyz123456789' });

    const results: TjResponse[] = [];
    for await (const result of generator) {
      results.push(result);
    }

    // Should complete without throwing errors
    expect(results.length).toBe(0);
  }, 15000);

  it('should handle English search terms', async () => {
    const generator = searchTJ({ query: 'love' });

    const results: TjResponse[] = [];
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
      expect(Array.isArray(firstResult.title)).toBe(true);
      expect(typeof firstResult.singer).toBe('string');
    }
  }, 30000);

  it('should return results with proper ID format', async () => {
    const generator = searchTJ({ query: '노래' });

    let count = 0;
    for await (const result of generator) {
      // TJ song IDs should be positive numbers
      expect(typeof result.id).toBe('number');
      expect(result.id).toBeGreaterThan(0);
      expect(Number.isInteger(result.id)).toBe(true);

      count++;
      if (count >= 2) break; // Test first 2 results
    }

    expect(count).toBeGreaterThan(0);
  }, 30000);

  it('should handle pagination correctly', async () => {
    const generator = searchTJ({ query: '사랑' });

    const results: TjResponse[] = [];
    let count = 0;
    const maxResults = 20; // Get more than one page (15 per page)

    for await (const result of generator) {
      results.push(result);
      count++;
      if (count >= maxResults) break;
    }

    // Should get results from multiple pages
    expect(results.length).toBeGreaterThan(15);

    // All results should have unique IDs
    const ids = results.map((r) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  }, 45000); // Longer timeout for multiple pages

  it('should find specific Japanese song - ザムザ by てにをは', async () => {
    const generator = searchTJ({ query: 'ザムザ' });

    const results: TjResponse[] = [];
    let targetSong: TjResponse | undefined;

    // Search through results to find the specific song
    for await (const result of generator) {
      results.push(result);

      // Check if this is the target song (ID 68801 by てにをは)
      if (result.id === 68801 && result.singer.includes('てにをは')) {
        targetSong = result;
        break;
      }

      // Limit search to avoid infinite loop
      if (results.length >= 50) break;
    }

    // Should find the specific song
    expect(targetSong).toBeDefined();
    expect(targetSong!.id).toBe(68801);
    expect(targetSong!.singer).toContain('てにをは');

    // Check that title contains ザムザ
    const titleText = targetSong!.title.map((t) => t.content).join('');
    expect(titleText).toContain('ザムザ');

    // Validate structure
    expect(Array.isArray(targetSong!.title)).toBe(true);
    expect(targetSong!.title.length).toBeGreaterThan(0);
    expect(typeof targetSong!.singer).toBe('string');
    expect(targetSong!.singer.length).toBeGreaterThan(0);
  }, 60000); // Longer timeout for specific search

  it('should find specific Japanese song - アヤノの幸福理論 by じん', async () => {
    const generator = searchTJ({ query: 'アヤノの幸福理論' });

    const results: TjResponse[] = [];
    let targetSong: TjResponse | undefined;

    // Search through results to find the specific song
    for await (const result of generator) {
      results.push(result);

      // Check if this is the target song (ID 28169 by じん)
      if (result.id === 28169 && result.composer && result.composer.includes('じん')) {
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

    expect(targetSong.id).toBe(28169);
    expect(targetSong.composer).toBeDefined();
    expect(targetSong.composer).toContain('じん');

    // Check that title contains アヤノの幸福理論
    const titleText = targetSong.title.map((t) => t.content).join('');
    expect(titleText).toContain('アヤノの幸福理論');

    // Check for the specific tag
    expect(targetSong.tags).toBeDefined();
    expect(Array.isArray(targetSong.tags)).toBe(true);
    expect(targetSong.tags).toContain('60이상 반주기 전용곡');

    // Validate structure
    expect(Array.isArray(targetSong.title)).toBe(true);
    expect(targetSong.title.length).toBeGreaterThan(0);
    expect(typeof targetSong.singer).toBe('string');
    expect(targetSong.singer.length).toBeGreaterThan(0);
    expect(typeof targetSong.composer).toBe('string');
    expect(targetSong.composer?.length).toBeGreaterThan(0);
  }, 60000); // Longer timeout for specific search
});
