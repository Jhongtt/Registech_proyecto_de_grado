import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': 'warn',
      // Reglas agresivas de react-hooks v7 que disparan en código legacy
      // (patrones ya existentes del proyecto). Se mantienen como warning
      // para no romper el build mientras se migra gradualmente.
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      // AuthContext exporta el hook además del Provider (patrón estándar).
      'react-refresh/only-export-components': 'warn'
    },
  },
])