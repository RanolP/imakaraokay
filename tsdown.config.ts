import { defineConfig } from 'tsdown'

export default defineConfig({
  // Enable workspace mode for building multiple packages
  workspace: true,
  
  // Common configuration for all packages
  format: ['es', 'cjs'],
  platform: 'node',
  
  // Enable declaration files
  dts: true,
  
  // Enable sourcemaps for debugging
  sourcemap: true,
  
  // Clean output directories before build
  clean: true,
  
  // Enable tree shaking
  treeshake: true,
  
  // Output directory (relative to each package)
  outDir: 'dist',
  
  // Common externals for all packages
  external: [
    // Node.js built-ins
    /^node:/,
    // Common dependencies that should remain external
    'chalk',
    'cheerio',
    'google-sr',
    'undici'
  ],
  
  // Enable unbundle mode to preserve module structure
  unbundle: true,
  
  // Enable shims for ESM compatibility
  shims: true
}) 
