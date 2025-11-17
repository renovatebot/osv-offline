import { env } from 'node:process';
import { defineConfig } from 'vitest/config';

const ci = !!env.CI;

export default defineConfig({
  test: {
    testTimeout: 60_000,
    hookTimeout: 60_000,
    reporters: ci ? ['verbose', 'github-actions', 'junit'] : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ci
        ? ['text-summary', 'json']
        : ['text-summary', 'html', 'json'],
      enabled: ci ? true : undefined,
      reportOnFailure: true,
    },
  },
});
