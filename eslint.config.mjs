import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPromise from 'eslint-plugin-promise';
import eslintContainerbase from '@containerbase/eslint-plugin';

export default tseslint.config(
  {
    // TODO: fix ignores
    ignores: ['**/dist/**/*', 'eslint.config.mjs', 'vitest.config.mjs'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintPluginImport.flatConfigs.errors,
  eslintPluginImport.flatConfigs.warnings,
  eslintPluginImport.flatConfigs.recommended,
  eslintPluginImport.flatConfigs.typescript,
  eslintPluginPromise.configs['flat/recommended'],
  eslintContainerbase.configs.all,
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.lint.json',
        },
      },
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

      parserOptions: {
        project: [
          'tsconfig.json',
          './packages/osv-offline/tsconfig.json',
          './packages/osv-offline-db/tsconfig.json',
          './packages/osv-offline-updater/tsconfig.json',
        ],
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
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

      'import/no-unresolved': 0,
    },
  },
  {
    files: ['**/*.spec.ts', 'test/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 0,
    },
  }
);
