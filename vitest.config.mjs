import { env } from 'node:process';
import { coverageConfigDefaults, defineConfig } from 'vitest/config';

const ci = !!env.CI;

export default defineConfig({
  test: {
    env: {
      DEBUG: 'osv-offline:*',
    },
    testTimeout: 60_000,
    hookTimeout: 60_000,
    reporters: ci ? ['verbose', 'github-actions', 'junit'] : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ci ? ['text-summary', 'json'] : ['text-summary', 'html', 'json'],
      enabled: ci ? true : undefined,
      reportOnFailure: true,
      exclude: [
        ...coverageConfigDefaults.exclude,
        // the updater script and its OSV download client
        'packages/osv-offline-updater/src/index.ts',
        'packages/osv-offline-updater/src/client/osv.ts',
        'packages/osv-offline-updater/dist/**',
      ],
    },
  },
});
