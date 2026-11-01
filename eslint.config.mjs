import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'apps/web/dist/**',
      'node_modules/**',
      'app.js',
      'packages/contracts/openapi/generated.ts',
      // The v2 client is an approved generated artifact. Its runtime module
      // intentionally targets browser globals and is linted by its generator
      // typecheck rather than the repository TypeScript rule set.
      'packages/contracts/openapi/v2/client.ts',
      'packages/contracts/openapi/v2/client.mjs',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
    },
  },
);
