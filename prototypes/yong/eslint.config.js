import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // useScrollAnimation returns { ref, isVisible } — passing ref as JSX ref prop is standard React
      'react-hooks/refs': 'off',
      // Closing mobile menu on route change requires setState in effect
      'react-hooks/set-state-in-effect': 'off',
      // Warn on unused vars, allow _ prefix for intentionally unused params
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Allow any for third-party library workarounds (e.g. Leaflet icon fix)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Decorative animations use Math.random() in render — not a purity concern
      'react-hooks/purity': 'off',
      // Some pages export helper functions alongside components
      'react-refresh/only-export-components': 'warn',
    },
  },
])
