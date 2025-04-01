import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 15000,
    typecheck: {
      enabled: true,
      tsconfig: 'tsconfig.jest.json',
    },
  },
});
