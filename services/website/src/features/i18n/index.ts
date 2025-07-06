// Export types
export type { Language, TranslationKeys } from './types';

// Export store and utilities
export { i18nStore, getCurrentTranslations } from './model/i18n-store';

// Export UI components
export { default as LanguageSwitcher } from './ui/language-switcher';

// Export locales for direct access if needed
export { ko } from './locales/ko';
export { en } from './locales/en';

// Convenience hook for components
import { i18nStore } from './model/i18n-store';

export const useTranslation = () => {
  return {
    t: i18nStore.t,
    language: i18nStore.language,
    setLanguage: i18nStore.setLanguage,
    toggleLanguage: i18nStore.toggleLanguage,
  };
};
