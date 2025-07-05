import { defineConfig, presetAttributify, presetIcons, presetTypography, presetWebFonts, presetWind3, presetWind4, transformerDirectives, transformerVariantGroup } from 'unocss'

export default defineConfig({
  theme: {
    colors: {
      // Define custom colors for your karaoke app theme here
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
    },
    fontFamily: {
      sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', '"Helvetica Neue"', '"Segoe UI"', '"Apple SD Gothic Neo"', '"Noto Sans KR"', '"Malgun Gothic"', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', 'sans-serif'],
    }
  },
  presets: [
    presetWind3({
      dark: 'class',
    }),
    presetAttributify(),
    presetIcons(),
    presetTypography(),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
}) 
