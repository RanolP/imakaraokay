import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/**/*.d.ts',
        '**/*.config.*',
        '**/*.test.*',
        '**/*.spec.*'
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    setupFiles: []
  }
}); 
