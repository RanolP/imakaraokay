import { createSignal, createEffect, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import type { Language, TranslationKeys } from '../types';
import { ko } from '../locales/ko';
import { en } from '../locales/en';

const STORAGE_KEY = 'imakaraokay_language';
const DEFAULT_LANGUAGE: Language = 'ko'; // Korean as primary language

// Available translations
const translations: Record<Language, TranslationKeys> = {
  ko,
  en,
};

// Get initial language from localStorage or default to Korean
const getInitialLanguage = (): Language => {
  if (isServer) return DEFAULT_LANGUAGE;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === 'ko' || stored === 'en')) {
      return stored as Language;
    }
  } catch (error) {
    console.warn('Failed to read language from localStorage:', error);
  }

  return DEFAULT_LANGUAGE;
};

// Create reactive signal for current language
const [currentLanguage, setCurrentLanguage] = createSignal<Language>(getInitialLanguage());

// Save language to localStorage when it changes - only on client
if (!isServer) {
  createEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currentLanguage());
    } catch (error) {
      console.warn('Failed to save language to localStorage:', error);
    }
  });
}

// Get current translations
export const getCurrentTranslations = () => translations[currentLanguage()];

// Language management functions
export const i18nStore = {
  // Get current language
  language: currentLanguage,

  // Set language
  setLanguage: (language: Language) => {
    setCurrentLanguage(language);
  },

  // Toggle between Korean and English
  toggleLanguage: () => {
    setCurrentLanguage((prev) => (prev === 'ko' ? 'en' : 'ko'));
  },

  // Get translation for a specific key
  t: (key: string): string => {
    const translations = getCurrentTranslations();
    const keys = key.split('.');

    let result: any = translations;
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return the key itself as fallback
      }
    }

    return typeof result === 'string' ? result : key;
  },

  // Get available languages
  getAvailableLanguages: () => Object.keys(translations) as Language[],

  // Check if a language is available
  isLanguageAvailable: (language: string): language is Language => {
    return language in translations;
  },
};
