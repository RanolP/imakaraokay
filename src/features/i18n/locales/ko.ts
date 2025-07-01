import type { TranslationKeys } from '../types';

export const ko: TranslationKeys = {
  nav: {
    home: '홈',
    about: '소개',
    error: '오류',
  },
  
  home: {
    title: '🎤 이마카라오케',
    subtitle: '모든 카라오케 기기에서 좋아하는 노래를 찾아보세요',
    searchPlaceholder: '제목, 가수, 가사로 검색...',
    searchResults: '검색 결과',
    noResults: {
      title: '검색 결과가 없습니다',
      subtitle: '다른 키워드로 검색하거나 철자를 확인해보세요',
    },
    popularSongs: '🔥 인기 곡',
    loading: '로딩 중...',
  },
  
  about: {
    title: '소개',
    description: '이 웹사이트에 대한 모든 것',
    weLovenpm: '우리는',
  },
  
  common: {
    search: '검색',
    loading: '로딩 중',
    error: '오류',
  },
  
  song: {
    artists: '가수',
    originalTitle: '원제',
    englishTitle: '영제',
    lyrics: '가사',
    noLyrics: '가사 정보가 없습니다',
    availableOn: '이용 가능한 기기',
  },
}; 
