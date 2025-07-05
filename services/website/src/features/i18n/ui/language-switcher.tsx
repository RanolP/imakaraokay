import { Component, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { isServer } from 'solid-js/web';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';
import { i18nStore } from '../model/i18n-store';
import type { Language } from '../types';

interface LanguageSwitcherProps {
  class?: string;
}

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

const LanguageSwitcher: Component<LanguageSwitcherProps> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);
  let buttonRef: HTMLButtonElement | undefined;
  let dropdownRef: HTMLDivElement | undefined;

  const currentLang = i18nStore.language;
  const currentLanguageData = () => languages.find(lang => lang.code === currentLang());

  const updatePosition = async () => {
    if (isServer || !buttonRef || !dropdownRef) return;

    const { x, y } = await computePosition(buttonRef, dropdownRef, {
      placement: 'bottom-end',
      middleware: [
        offset(8),
        flip(),
        shift({ padding: 8 }),
      ],
    });

    dropdownRef.style.left = `${x}px`;
    dropdownRef.style.top = `${y}px`;
  };

  const handleToggle = async () => {
    setIsOpen(!isOpen());
    if (!isOpen()) {
      await updatePosition();
    }
  };

  const handleLanguageSelect = (language: Language) => {
    i18nStore.setLanguage(language);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      buttonRef && !buttonRef.contains(event.target as Node) &&
      dropdownRef && !dropdownRef.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  onMount(() => {
    if (!isServer) {
      document.addEventListener('click', handleClickOutside);
    }
  });

  onCleanup(() => {
    if (!isServer) {
      document.removeEventListener('click', handleClickOutside);
    }
  });

  return (
    <div class={`relative ${props.class || ''}`}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200 hover:text-purple-600"
        title={currentLang() === 'ko' ? 'Switch language' : '언어 변경'}
      >
        <span class="text-base leading-none">
          {currentLanguageData()?.flag}
        </span>
        <span class="hidden sm:inline">
          {currentLanguageData()?.label}
        </span>
        <svg 
          class={`w-4 h-4 transition-all duration-200 ${isOpen() ? 'rotate-180 text-purple-600' : 'text-gray-400'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Show when={isOpen()}>
        <div
          ref={dropdownRef}
          class="fixed z-50 bg-white dark:bg-gray-800 min-w-40"
          style={{ position: 'absolute' }}
        >
          {languages.map((language) => (
            <button
              onClick={() => handleLanguageSelect(language.code)}
              class={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors duration-150 ${
                currentLang() === language.code 
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span class="text-base leading-none">{language.flag}</span>
              <span class="font-medium flex-1">{language.label}</span>
              <Show when={currentLang() === language.code}>
                <div class="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full" />
              </Show>
            </button>
          ))}
        </div>
      </Show>
    </div>
  );
};

export default LanguageSwitcher;
