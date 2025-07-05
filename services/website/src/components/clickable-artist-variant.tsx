import { Component, createSignal, onMount, onCleanup, Show, createMemo } from 'solid-js';
import { isServer } from 'solid-js/web';
import { computePosition, flip, shift, offset } from '@floating-ui/dom';
import type { Artist } from '../types/song';
import { useTranslation } from '../features/i18n';

interface ClickableArtistVariantProps {
  artist: Artist;
  class?: string;
}

type ArtistLanguage = 'original' | 'japanese' | 'english' | 'korean';

interface ArtistOption {
  key: ArtistLanguage;
  label: string;
  flag: string;
}

const ClickableArtistVariant: Component<ClickableArtistVariantProps> = (props) => {
  const { language } = useTranslation();
  
  // Map global language to artist language
  const getInitialLanguage = (): ArtistLanguage => {
    const langMapping = {
      ko: 'korean' as const,
      en: 'english' as const
    };
    
    const artistLang = langMapping[language()];
    
    // Check if the artist has the preferred language, fallback to original
    if (artistLang && props.artist.name[artistLang]) {
      return artistLang;
    }
    
    return 'original';
  };

  const [selectedLanguage, setSelectedLanguage] = createSignal<ArtistLanguage>(getInitialLanguage());
  const [isOpen, setIsOpen] = createSignal(false);
  let buttonRef: HTMLButtonElement | undefined;
  let dropdownRef: HTMLDivElement | undefined;

  // Get available artist name options based on what's available in the artist
  const getAvailableOptions = createMemo((): ArtistOption[] => {
    const options: ArtistOption[] = [
      { key: 'original', label: 'Original', flag: '🌐' },
    ];

    if (props.artist.name.japanese) {
      options.push({ key: 'japanese', label: 'Japanese', flag: '🇯🇵' });
    }

    if (props.artist.name.english) {
      options.push({ key: 'english', label: 'English', flag: '🇺🇸' });
    }

    if (props.artist.name.korean) {
      options.push({ key: 'korean', label: 'Korean', flag: '🇰🇷' });
    }

    return options;
  });

  // Get artist name preview for a specific language
  const getArtistPreview = (language: ArtistLanguage): string => {
    let name: string;
    if (language !== 'original' && props.artist.name[language]) {
      const langName = props.artist.name[language];
      if (langName && typeof langName === 'object' && 'main' in langName) {
        name = langName.main;
      } else {
        name = props.artist.name.original;
      }
    } else {
      name = props.artist.name.original;
    }
    // Truncate if too long to keep dropdown manageable
    return name.length > 40 ? name.substring(0, 37) + '...' : name;
  };

  // Get aliases for the currently selected language
  const getCurrentAliases = createMemo(() => {
    const language = selectedLanguage();
    if (language === 'original') {
      return []; // Original names don't have aliases in this structure
    }
    
    const nameData = props.artist.name[language];
    if (nameData && typeof nameData === 'object' && 'aliases' in nameData) {
      const aliases = nameData.aliases || [];
      // Filter out hidden aliases and return only the text
      return aliases
        .filter(alias => !alias.hidden)
        .map(alias => alias.text);
    }
    
    return [];
  });

  // Get current artist name based on selected language
  const getCurrentName = createMemo(() => {
    const language = selectedLanguage();
    if (language !== 'original' && props.artist.name[language]) {
      const langName = props.artist.name[language];
      if (langName && typeof langName === 'object' && 'main' in langName) {
        return langName.main;
      }
    }
    return props.artist.name.original;
  });

  // Check if we should show original name in parentheses
  const shouldShowOriginal = createMemo(() => {
    const current = getCurrentName();
    const original = props.artist.name.original;
    return selectedLanguage() !== 'original' && current !== original;
  });

  const updatePosition = async () => {
    if (isServer || !buttonRef || !dropdownRef) return;

    const { x, y } = await computePosition(buttonRef, dropdownRef, {
      placement: 'bottom-start',
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
    if (getAvailableOptions().length <= 1) return; // Don't show dropdown if only one option
    
    setIsOpen(!isOpen());
    if (!isOpen()) {
      await updatePosition();
    }
  };

  const handleLanguageSelect = (language: ArtistLanguage) => {
    setSelectedLanguage(language);
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

  const hasMultipleOptions = () => getAvailableOptions().length > 1;

  return (
    <div class={`relative ${props.class || ''}`}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        class={`text-left transition-colors duration-200 ${
          hasMultipleOptions() 
            ? 'hover:text-purple-200 cursor-pointer' 
            : 'cursor-default'
        }`}
        disabled={!hasMultipleOptions()}
      >
        {/* Artist name in header format */}
        <h1 class="text-3xl md:text-4xl font-bold mb-2">
          <span class="text-purple-200">🎤</span>
          {getCurrentName()}
          {shouldShowOriginal() && (
            <span class="text-white opacity-75"> ({props.artist.name.original})</span>
          )}
          {hasMultipleOptions() && (
            <svg 
              class={`inline-block w-6 h-6 ml-2 transition-all duration-200 text-white ${
                isOpen() ? 'rotate-180' : ''
              }`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </h1>
        
        {/* Show aliases for the selected language if any exist */}
        <Show when={getCurrentAliases().length > 0}>
          <div class="text-lg text-white opacity-75 mb-2">
            <span class="text-sm text-white opacity-60">Also known as: </span>
            {getCurrentAliases().map((alias, index) => (
              <>
                <span class="text-white opacity-75">⟨</span>
                {alias}
                <span class="text-white opacity-75">⟩</span>
                {index < getCurrentAliases().length - 1 && ', '}
              </>
            ))}
          </div>
        </Show>
      </button>

      <Show when={isOpen() && hasMultipleOptions()}>
        <div
          ref={dropdownRef}
          class="fixed z-50 bg-white dark:bg-gray-200 min-w-64 max-w-80 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          style={{ position: 'absolute' }}
        >
          {getAvailableOptions().map((option) => (
            <button
              onClick={() => handleLanguageSelect(option.key)}
              class={`w-full flex items-start gap-3 px-4 py-3 text-sm text-left transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
                selectedLanguage() === option.key 
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span class="text-base leading-none mt-0.5">{option.flag}</span>
              <div class="flex-1 min-w-0">
                <div class="font-medium">{option.label}</div>
                <div class="text-xs opacity-75 mt-1 truncate">
                  <span class="text-purple-600 dark:text-purple-400">⟨</span>
                  {getArtistPreview(option.key)}
                  <span class="text-purple-600 dark:text-purple-400">⟩</span>
                </div>
              </div>
              <Show when={selectedLanguage() === option.key}>
                <div class="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full mt-1.5 shrink-0" />
              </Show>
            </button>
          ))}
        </div>
      </Show>
    </div>
  );
};

export default ClickableArtistVariant; 
