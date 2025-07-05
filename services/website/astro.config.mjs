import { defineConfig } from 'astro/config';
import solidJs from '@astrojs/solid-js';
import sitemap from '@astrojs/sitemap';
import UnoCSS from 'unocss/astro';
import node from '@astrojs/node';

// Check if we're in development mode
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  site: 'https://your-domain.com', // Update this to your actual domain
  integrations: [
    solidJs(),
    sitemap(),
    UnoCSS()
  ],
  output: isDev ? 'server' : 'static',
  adapter: isDev ? node({ mode: 'standalone' }) : undefined,
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
