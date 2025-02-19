module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:jest/recommended',
    'plugin:jest/style',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:promise/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 11,
    project: [
      'tsconfig.json',
      './packages/osv-offline/tsconfig.json',
      './packages/osv-offline-db/tsconfig.json',
      './packages/osv-offline-updater/tsconfig.json',
    ],
  },
  ignorePatterns: ['**/dist/**', 'jest.config.ts', '.eslintrc.js'],
  rules: {
    'sort-imports': [
      'error',
      {
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      },
    ],
    'import/no-unresolved': 0, // TODO: needs lint upgrades, typescript is also handling it
  },
  overrides: [
    {
      // files to check, so no `--ext` is required
      files: ['**/*.{js,mjs,cjs,ts}'],
    },
    {
      files: ['**/*.spec.ts', 'test/**'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 0,
      },
    },
  ],
};
