import { env } from 'node:process';
import { defineConfig } from 'vitest/config';

const ci = !!env.CI;

export default defineConfig({
  test: {
    testTimeout: 15000,
    hookTimeout: 15000,
    reporters: ci ? ['verbose', 'github-actions', 'json'] : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'json'],
      reportOnFailure: true,
    },
  },
});
