import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { configs, plugins } from 'eslint-config-airbnb-extended';
import prettier from 'eslint-plugin-prettier/recommended';
import angular from 'angular-eslint';

export default defineConfig([
  { ignores: ['dist/**', '.angular/**', 'node_modules/**'] },
  { name: 'js/recommended', files: ['**/*.ts'], ...js.configs.recommended },
  plugins.stylistic,
  plugins.importX,
  plugins.typescriptEslint,
  ...configs.base.recommended,
  ...configs.base.typescript,
  {
    files: ['**/*.ts'],
    extends: [angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      'import-x/prefer-default-export': 'off',
      'class-methods-use-this': 'off',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-void': ['error', { allowAsStatement: true }],
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  prettier,
]);
