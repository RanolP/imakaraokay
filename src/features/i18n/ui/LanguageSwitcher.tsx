import { Component, createSignal, onMount, onCleanup, Show } from 'solid-js';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';
import { i18nStore } from '../model/i18nStore';
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
    if (!buttonRef || !dropdownRef) return;

    const { x, y } = await computePosition(buttonRef, dropdownRef, {
      placement: 'bottom-end',
      middleware: [
        offset(4),
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
    document.addEventListener('click', handleClickOutside);
  });

  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside);
  });

  return (
    <div class={`relative ${props.class || ''}`}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
        title={currentLang() === 'ko' ? 'Switch language' : '언어 변경'}
      >
        <span class="text-lg">
          {currentLanguageData()?.flag}
        </span>
        <span>
          {currentLanguageData()?.label}
        </span>
        <svg 
          class={`w-4 h-4 transition-transform ${isOpen() ? 'rotate-180' : ''}`}
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
          class="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-32"
          style={{ position: 'absolute' }}
        >
          {languages.map((language) => (
            <button
              onClick={() => handleLanguageSelect(language.code)}
              class={`w-full flex items-center space-x-3 px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                currentLang() === language.code ? 'bg-purple-50 text-purple-600' : 'text-gray-700'
              }`}
            >
              <span class="text-lg">{language.flag}</span>
              <span class="font-medium">{language.label}</span>
              <Show when={currentLang() === language.code}>
                <svg class="w-4 h-4 ml-auto text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </Show>
            </button>
          ))}
        </div>
      </Show>
    </div>
  );
};

export default LanguageSwitcher; 
