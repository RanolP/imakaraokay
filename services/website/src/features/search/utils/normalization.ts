/**
 * Text normalization utilities for search
 * NFKD normalization is crucial for accurate Korean/Japanese text matching
 */

/**
 * Normalizes text to NFKD form for consistent search matching
 * @param text - The text to normalize
 * @returns NFKD normalized text
 */
export function normalizeForSearch(text: string): string {
  return text.normalize('NFKD').toLowerCase().trim();
}

/**
 * Normalizes an array of strings
 * @param texts - Array of texts to normalize
 * @returns Array of normalized texts
 */
export function normalizeArrayForSearch(texts: string[]): string[] {
  return texts.map((text) => normalizeForSearch(text));
}

/**
 * Safely normalizes a string that might be undefined
 * @param text - The text to normalize (can be undefined)
 * @returns Normalized text or empty string if input was undefined
 */
export function safeNormalizeForSearch(text: string | undefined): string {
  return text ? normalizeForSearch(text) : '';
}
