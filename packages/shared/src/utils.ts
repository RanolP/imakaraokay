import type { KaraokeMachineInfo, KaraokeProvider } from './types.js';

// Karaoke machine information
export const KARAOKE_MACHINES: Record<KaraokeProvider, KaraokeMachineInfo> = {
  TJ: {
    id: 'TJ',
    name: 'TJ Karaoke',
    color: '#00AFEC',
    website: 'https://www.tjmedia.co.kr'
  },
  KY: {
    id: 'KY',
    name: 'KY Karaoke',
    color: '#8877dd',
    website: 'https://www.kysing.kr'
  },
  Joysound: {
    id: 'Joysound',
    name: 'Joysound',
    color: '#d70e18',
    website: 'https://www.joysound.com'
  },
  EBO: {
    id: 'EBO',
    name: 'EBO Karaoke',
    color: '#6b7280'
  }
};

// Text normalization utilities
export function normalizeForSearch(text: string): string {
  return text.normalize('NFKD').toLowerCase().trim();
}

export function normalizeArrayForSearch(arr: string[]): string[] {
  return arr.map(normalizeForSearch);
}

export function safeNormalizeForSearch(text: string | undefined | null): string {
  if (!text) return '';
  return normalizeForSearch(text);
}

// URL utilities
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Validation utilities
export function isValidKaraokeId(id: string, provider: KaraokeProvider): boolean {
  if (!id || id.trim() === '') return false;
  
  switch (provider) {
    case 'TJ':
      return /^\d{5,6}$/.test(id);
    case 'KY':
      return /^\d{5,6}$/.test(id);
    case 'Joysound':
      return /^\d{6,8}$/.test(id);
    case 'EBO':
      return /^\d{4,6}$/.test(id);
    default:
      return false;
  }
} 
