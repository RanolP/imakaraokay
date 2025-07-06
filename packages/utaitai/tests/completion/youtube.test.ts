import { describe, it, expect } from 'vitest';
import { completeYouTube } from '../../src/completion/youtube.js';

describe('completeYouTube', () => {
  it('should return suggestions for a popular English query', async () => {
    const result = await completeYouTube({ query: 'hello' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(10); // YouTube typically returns up to 10 suggestions

    // All suggestions should be strings
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain relevant suggestions
    const hasRelevantSuggestion = result.some((suggestion) =>
      suggestion.toLowerCase().includes('hello'),
    );
    expect(hasRelevantSuggestion).toBe(true);
  }, 10000); // 10 second timeout for network request

  it('should return suggestions for Korean query', async () => {
    const result = await completeYouTube({ query: '사랑' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // All suggestions should be strings
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain Korean suggestions
    const hasKoreanSuggestion = result.some((suggestion) => /[가-힣]/.test(suggestion));
    expect(hasKoreanSuggestion).toBe(true);
  }, 10000);

  it('should return suggestions for music-related query', async () => {
    const result = await completeYouTube({ query: 'karaoke' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // All suggestions should be strings
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain karaoke-related suggestions
    const hasKaraokeSuggestion = result.some((suggestion) =>
      suggestion.toLowerCase().includes('karaoke'),
    );
    expect(hasKaraokeSuggestion).toBe(true);
  }, 10000);

  it('should handle empty query gracefully', async () => {
    const result = await completeYouTube({ query: '' });

    expect(Array.isArray(result)).toBe(true);
    // Empty query might return empty array or some default suggestions
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
    });
  }, 10000);

  it('should handle single character query', async () => {
    const result = await completeYouTube({ query: 'a' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  }, 10000);

  it('should handle special characters in query', async () => {
    const result = await completeYouTube({ query: 'rock & roll' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain relevant suggestions
    const hasRelevantSuggestion = result.some((suggestion) =>
      suggestion.toLowerCase().includes('rock'),
    );
    expect(hasRelevantSuggestion).toBe(true);
  }, 10000);

  it('should handle Japanese query', async () => {
    const result = await completeYouTube({ query: 'カラオケ' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain Japanese suggestions
    const hasJapaneseSuggestion = result.some(
      (suggestion) =>
        /[ひらがなカタカナ漢字]/.test(suggestion) ||
        /[ぁ-ゔ]/.test(suggestion) ||
        /[ァ-ヴー]/.test(suggestion),
    );
    expect(hasJapaneseSuggestion).toBe(true);
  }, 10000);

  it('should handle long query', async () => {
    const longQuery = 'how to sing karaoke songs better with good technique';
    const result = await completeYouTube({ query: longQuery });

    expect(Array.isArray(result)).toBe(true);
    // Long queries might return fewer suggestions or none
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  }, 10000);

  it('should handle numeric query', async () => {
    const result = await completeYouTube({ query: '2024' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  }, 10000);

  it('should handle artist name query', async () => {
    const result = await completeYouTube({ query: 'BTS' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain BTS-related suggestions
    const hasBTSSuggestion = result.some((suggestion) => suggestion.toLowerCase().includes('bts'));
    expect(hasBTSSuggestion).toBe(true);
  }, 10000);

  it('should return unique suggestions', async () => {
    const result = await completeYouTube({ query: 'music' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check for uniqueness
    const uniqueSuggestions = new Set(result);
    expect(uniqueSuggestions.size).toBe(result.length);
  }, 10000);

  it('should handle very obscure query', async () => {
    const result = await completeYouTube({ query: 'xyzabc123unlikely' });

    expect(Array.isArray(result)).toBe(true);
    // Obscure queries might return empty array
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
    });
  }, 10000);

  it('should handle query with emojis', async () => {
    const result = await completeYouTube({ query: 'music 🎵' });

    expect(Array.isArray(result)).toBe(true);
    // Emoji queries might work or not, but should not crash
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
    });
  }, 10000);
});
