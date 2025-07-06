import { defineConfig } from 'tsdown';

export default defineConfig({
  // Entry point for the shared package
  entry: 'src/index.ts',

  // Package-specific configuration
  name: '@imakaraokay/shared',

  // Ensure all dependencies are external since this is a library
  external: [
    // Keep all dependencies external
    'chalk',
    'cheerio',
    'google-sr',
    'undici',
    // Node.js built-ins
    /^node:/,
    // Any other dependencies
    /^@types\//,
  ],
});
