import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPromise from 'eslint-plugin-promise';
import eslintContainerbase from '@containerbase/eslint-plugin';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import * as importX from 'eslint-plugin-import-x';
import { defineConfig, globalIgnores } from 'eslint/config';
import vitest from '@vitest/eslint-plugin';

const jsFiles = { files: ['**/*.{js,cjs,mjs,mts,ts}'] };

export default defineConfig(
  globalIgnores(['**/dist/**', '**/coverage/**']),
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  vitest.configs.recommended,
  eslintPluginPromise.configs['flat/recommended'],
  eslintContainerbase.configs.all,
  {
    ...jsFiles,
    extends: [importX.flatConfigs.recommended, importX.flatConfigs.typescript],

    languageOptions: {
      globals: {
        ...globals.node,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs', 'vitest.config.mjs'],
          defaultProject: 'tsconfig.lint.json',
        },
        // false positive on typescript v6
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        tsconfigRootDir: import.meta.dirname,
      },
    },

    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({ project: 'tsconfig.lint.json' }),
      ],
      // TODO: fix me
      'import-x/ignore': ['fs-extra'],
    },
  },
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },

      ecmaVersion: 11,
      sourceType: 'commonjs',
    },
  },
  {
    ...jsFiles,
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

      'import-x/no-named-as-default-member': 0,
    },
  },
  {
    files: ['**/*.spec.ts', 'test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 0,
    },
  }
);
