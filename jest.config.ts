import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  preset: "ts-jest",
  testPathIgnorePatterns: ["dist"],
  setupFilesAfterEnv: ["jest-extended/all", "expect-more-jest"],
  testTimeout: 15000,
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
  },
};

export default config;
