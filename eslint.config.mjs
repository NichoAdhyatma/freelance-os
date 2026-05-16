import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import tseslint from '@typescript-eslint/eslint-plugin';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tailwindcss from 'eslint-plugin-tailwindcss';
import eslintConfigPrettier from 'eslint-config-prettier';

// NOTE: Type-aware @typescript-eslint rules (no-floating-promises,
// no-misused-promises, await-thenable, restrict-plus-operands, etc.)
// require parserOptions: { project: "./tsconfig.json" } and are deferred
// to Phase 4 to avoid breaking ESLint on files without type info (e.g.
// next.config.ts, *.config.ts, *.config.mjs).
//
// Tailwind config note: eslint-plugin-tailwindcss requires a tailwind.config.ts
// or CSS @theme block. With Tailwind v4's CSS-first config (globals.css), the
// plugin's default lookup fails — this is cosmetic and does not affect linting.
//
// react-hooks rules: silenced — the pattern `if (!user) { setState(); return; }`
// before a subscribe is intentional (avoids "loading forever" bugs).

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Plugins for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint,
      'simple-import-sort': simpleImportSort,
      tailwindcss,
    },
    rules: {
      // Import sorting (auto-fix)
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Tailwind class ordering
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/no-contradicting-classname': 'error',
      'tailwindcss/enforces-shorthand': 'warn',

      // TypeScript rules — NON-type-aware only (Phase 1 safe)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': true,
          'ts-nocheck': false,
          'ts-check': false,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // react-hooks: silence pedantic rules for intentional patterns
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },

  // Disable formatting rules covered by Prettier (MUST be last)
  { rules: eslintConfigPrettier.rules },

  // Ignore patterns — scripts/ are CJS dev tools (require() is allowed)
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'scripts/**']),
]);

export default eslintConfig;
