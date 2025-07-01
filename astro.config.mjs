import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';
import sitemap from '@astrojs/sitemap';
import UnoCSS from 'unocss/astro';

export default defineConfig({
  site: 'https://your-domain.com', // Update this to your actual domain
  integrations: [
    solidJs(),
    sitemap(),
    UnoCSS()
  ],
  output: 'static',
  build: {
    format: 'directory' // Creates clean URLs
  },
  server: {
    port: 3000
  },
  vite: {
    build: {
      target: 'esnext'
    }
  }
}); 
