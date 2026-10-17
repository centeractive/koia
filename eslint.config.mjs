import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default defineConfig(
    globalIgnores(['dist/', 'out-tsc/', 'tmp/', 'coverage/', 'test-results/', '.angular/', '.vitest/', 'e2e/*.js', 'e2e/*.map']),
    {
        files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
        extends: [js.configs.recommended]
    },
    {
        files: ['**/*.{ts,mts,cts}'],
        extends: [tseslint.configs.recommended]
    },
    {
        files: ['*.{js,mjs,cjs}', 'scripts/**/*.{js,mjs}'],
        languageOptions: { globals: globals.node }
    },
    {
        files: ['scripts/**/*.js'],
        languageOptions: { sourceType: 'commonjs' }
    }
);
