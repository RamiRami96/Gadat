import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { configs, plugins } from 'eslint-config-airbnb-extended';
import prettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default defineConfig([
  { ignores: ['dist/**', 'node_modules/**', 'src/generated/**', 'coverage/**'] },
  { name: 'js/recommended', files: ['**/*.ts'], ...js.configs.recommended },
  plugins.stylistic,
  plugins.importX,
  plugins.node,
  plugins.typescriptEslint,
  ...configs.base.recommended,
  ...configs.base.typescript,
  ...configs.node.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'off',
      'import-x/prefer-default-export': 'off',
      'import-x/extensions': 'off',
      'max-classes-per-file': 'off',
      'n/no-unsupported-features/node-builtins': ['error', { version: '>=24.10.0' }],
      'class-methods-use-this': 'off',
      'no-void': ['error', { allowAsStatement: true }],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
    },
  },
  {
    files: ['prisma/seed.ts'],
    rules: {
      'no-bitwise': 'off',
      'no-await-in-loop': 'off',
      'no-restricted-syntax': 'off',
      'no-continue': 'off',
      'no-console': 'off',
      'n/no-process-exit': 'off',
    },
  },
  {
    files: ['test/**/*.ts', 'prisma/seed.ts'],
    rules: { 'no-plusplus': 'off', 'no-await-in-loop': 'off' },
  },
  {
    files: ['prisma/seed.ts', 'src/common/load-env.ts', 'test/setup-env.ts'],
    rules: { 'n/no-sync': 'off' },
  },
  prettier,
]);
