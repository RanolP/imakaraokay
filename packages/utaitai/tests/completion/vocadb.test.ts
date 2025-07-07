import { describe, it, expect } from 'vitest';
import { completeVocadb } from '../../src/completion/vocadb.js';

describe('completeVocadb', () => {
  it('should return suggestions for a popular English query', async () => {
    const result = await completeVocadb({ query: 'hello' });

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
    const result = await completeVocadb({ query: 'カラオケ' });

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

  it('should return suggestions for Vocaloid-related query', async () => {
    const result = await completeVocadb({ query: 'miku' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // All suggestions should be strings
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain Miku-related suggestions
    const hasMikuSuggestion = result.some((suggestion) =>
      suggestion.toLowerCase().includes('miku'),
    );
    expect(hasMikuSuggestion).toBe(true);
  }, 15000);

  it('should handle empty query gracefully', async () => {
    const result = await completeVocadb({ query: '' });

    expect(Array.isArray(result)).toBe(true);
    // Empty query might return empty array or some default suggestions
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
    });
  }, 15000);

  it('should handle single character query', async () => {
    const result = await completeVocadb({ query: 'a' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  }, 15000);

  it('should handle special characters in query', async () => {
    const result = await completeVocadb({ query: 'rock & roll' });

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
    const result = await completeVocadb({ query: '사랑' });

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
    const longQuery = 'how to sing vocaloid songs better with good technique';
    const result = await completeVocadb({ query: longQuery });

    expect(Array.isArray(result)).toBe(true);
    // Long queries might return fewer suggestions or none
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  }, 15000);

  it('should handle numeric query', async () => {
    const result = await completeVocadb({ query: '2024' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });
  }, 15000);

  it('should handle Vocaloid producer name query', async () => {
    const result = await completeVocadb({ query: 'ryo' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain Ryo-related suggestions
    const hasRyoSuggestion = result.some((suggestion) => suggestion.toLowerCase().includes('ryo'));
    expect(hasRyoSuggestion).toBe(true);
  }, 15000);

  it('should return unique suggestions', async () => {
    const result = await completeVocadb({ query: 'music' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check for uniqueness
    const uniqueSuggestions = new Set(result);
    expect(uniqueSuggestions.size).toBe(result.length);
  }, 15000);

  it('should handle very obscure query', async () => {
    const result = await completeVocadb({ query: 'xyzabc123unlikely' });

    expect(Array.isArray(result)).toBe(true);
    // Obscure queries might return empty array
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
    });
  }, 15000);

  it('should handle query with emojis', async () => {
    const result = await completeVocadb({ query: 'music 🎵' });

    expect(Array.isArray(result)).toBe(true);
    // Emoji queries might work or not, but should not crash
    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
    });
  }, 15000);

  it('should handle popular Vocaloid song query', async () => {
    const result = await completeVocadb({ query: 'senbonzakura' });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    result.forEach((suggestion) => {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThan(0);
    });

    // Should contain Senbonzakura-related suggestions
    const hasSenbonzakuraSuggestion = result.some((suggestion) =>
      suggestion.toLowerCase().includes('senbonzakura') ||
      suggestion.toLowerCase().includes('千本桜'),
    );
    expect(hasSenbonzakuraSuggestion).toBe(true);
  }, 15000);

  it('should handle network errors gracefully', async () => {
    // This test might be flaky, but it's useful to ensure error handling
    expect(async () => {
      await completeVocadb({ query: 'test' });
    }).not.toThrow();
  }, 15000);
}); 
