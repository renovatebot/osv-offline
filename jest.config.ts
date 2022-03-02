import type { InitialOptionsTsJest } from 'ts-jest/dist/types';

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testPathIgnorePatterns: ['dist'],
  setupFilesAfterEnv: ['jest-extended/all', 'expect-more-jest'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.jest.json',
    },
  },
};

export default config;
