import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 15000,
    hookTimeout: 15000,
    reporters: ['verbose', 'github-actions', 'json'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      reportOnFailure: true,
    },
  },
});
