import type { InitialOptionsTsJest } from 'ts-jest/dist/types';

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testPathIgnorePatterns: ['dist'],
  setupFilesAfterEnv: ['jest-extended/all', 'expect-more-jest'],
  testTimeout: 15000,
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.jest.json',
    },
  },
};

export default config;
