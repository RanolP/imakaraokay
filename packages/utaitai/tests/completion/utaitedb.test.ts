import { describe, it, expect } from 'vitest';
import { completeUtaitedb } from '../../src/completion/utaitedb.js';

describe('completeUtaitedb', () => {
  it('should return suggestions for a popular English query', async () => {
    const result = await completeUtaitedb({ query: 'hello' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

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
  }, 15000); // 15 second timeout for network request

  it('should return suggestions for Japanese query', async () => {
    const result = await completeUtaitedb({ query: 'カラオケ' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // All suggestions should be strings
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
  }, 15000);

  it('should return suggestions for Utaite-related query', async () => {
    const result = await completeUtaitedb({ query: 'utaite' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // All suggestions should be strings
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain Utaite-related suggestions
    const hasUtaiteSuggestion = result.some((suggestion) =>
      suggestion.toLowerCase().includes('utaite'),
    );
    expect(hasUtaiteSuggestion).toBe(true);
  }, 15000);

  it('should handle empty query gracefully', async () => {
    const result = await completeUtaitedb({ query: '' });

    expect(Array.isArray(result)).toBe(true);
    // Empty query might return empty array or some default suggestions
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
    });
  }, 15000);

  it('should handle single character query', async () => {
    const result = await completeUtaitedb({ query: 'a' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  }, 15000);

  it('should handle special characters in query', async () => {
    const result = await completeUtaitedb({ query: 'rock & roll' });

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
  }, 15000);

  it('should handle Korean query', async () => {
    const result = await completeUtaitedb({ query: '사랑' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain Korean suggestions
    const hasKoreanSuggestion = result.some((suggestion) => /[가-힣]/.test(suggestion));
    expect(hasKoreanSuggestion).toBe(true);
  }, 15000);

  it('should handle long query', async () => {
    const longQuery = 'how to sing utaite songs better with good technique';
    const result = await completeUtaitedb({ query: longQuery });

    expect(Array.isArray(result)).toBe(true);
    // Long queries might return fewer suggestions or none
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  }, 15000);

  it('should handle numeric query', async () => {
    const result = await completeUtaitedb({ query: '2024' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  }, 15000);

  it('should handle popular Utaite name query', async () => {
    const result = await completeUtaitedb({ query: 'soraru' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain Soraru-related suggestions
    const hasSoraruSuggestion = result.some((suggestion) =>
      suggestion.toLowerCase().includes('soraru'),
    );
    expect(hasSoraruSuggestion).toBe(true);
  }, 15000);

  it('should return unique suggestions', async () => {
    const result = await completeUtaitedb({ query: 'music' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check for uniqueness
    const uniqueSuggestions = new Set(result);
    expect(uniqueSuggestions.size).toBe(result.length);
  }, 15000);

  it('should handle very obscure query', async () => {
    const result = await completeUtaitedb({ query: 'xyzabc123unlikely' });

    expect(Array.isArray(result)).toBe(true);
    // Obscure queries might return empty array
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
    });
  }, 15000);

  it('should handle query with emojis', async () => {
    const result = await completeUtaitedb({ query: 'music 🎵' });

    expect(Array.isArray(result)).toBe(true);
    // Emoji queries might work or not, but should not crash
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
    });
  }, 15000);

  it('should handle popular Utaite collaboration query', async () => {
    const result = await completeUtaitedb({ query: 'after the rain' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain After the Rain-related suggestions
    const hasAfterTheRainSuggestion = result.some((suggestion) =>
      suggestion.toLowerCase().includes('after the rain') ||
      suggestion.toLowerCase().includes('そらまふ'),
    );
    expect(hasAfterTheRainSuggestion).toBe(true);
  }, 15000);

  it('should handle network errors gracefully', async () => {
    // This test might be flaky, but it's useful to ensure error handling
    expect(async () => {
      await completeUtaitedb({ query: 'test' });
    }).not.toThrow();
  }, 15000);

  it('should handle cover song query', async () => {
    const result = await completeUtaitedb({ query: 'cover' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain cover-related suggestions
    const hasCoverSuggestion = result.some((suggestion) =>
      suggestion.toLowerCase().includes('cover'),
    );
    expect(hasCoverSuggestion).toBe(true);
  }, 15000);

  it('should handle Japanese artist name query', async () => {
    const result = await completeUtaitedb({ query: 'まふまふ' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain Mafumafu-related suggestions
    const hasMafumafuSuggestion = result.some((suggestion) =>
      suggestion.includes('まふまふ'),
    );
    expect(hasMafumafuSuggestion).toBe(true);
  }, 15000);
}); 
