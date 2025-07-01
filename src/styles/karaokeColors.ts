export const karaokeColors = {
  // TJ Media - Cyan blue theme (user specified #00AFEC)
  tj: {
    50: '#e6f9ff',
    100: '#ccf2ff',
    200: '#99e6ff',
    300: '#66d9ff',
    400: '#33ccff',
    500: '#00AFEC', // Main color as specified
    600: '#0099d6',
    700: '#0077a3',
    800: '#005c7a',
    900: '#003d52',
  },
  
  // KY (Kumyoung) - Purple-blue theme (user specified #8877dd)
  ky: {
    50: '#f4f2ff',
    100: '#e9e4ff',
    200: '#d6ceff',
    300: '#b8a8ff',
    400: '#9d88ff',
    500: '#8877dd', // Main color as specified
    600: '#7a66c7',
    700: '#6b55b1',
    800: '#5c459b',
    900: '#4d3885',
  },
  
  // EBO - Gray theme (placeholder for now)
  ebo: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Joysound - Red theme (user specified #d70e18)
  joysound: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#d70e18', // Main color as specified
    600: '#c20d16',
    700: '#a60b13',
    800: '#8a0910',
    900: '#6e070d',
  },
} as const;

export type KaraokeMachine = keyof typeof karaokeColors;
export type ColorShade = keyof typeof karaokeColors.tj; 
