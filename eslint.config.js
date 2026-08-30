import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import typescript from 'typescript-eslint';

export default typescript.config(
    {
        ignores: [
            'bootstrap/cache',
            'node_modules',
            'public/build',
            'storage',
            'vendor',
        ],
    },
    js.configs.recommended,
    ...typescript.configs.recommended,
    reactHooks.configs.flat.recommended,
    {
        files: ['tests/Release/**/*.mjs'],
        languageOptions: {
            globals: {
                ...globals.node,
                fetch: 'readonly',
                WebSocket: 'readonly',
            },
        },
    },
    {
        files: ['resources/js/**/*.{ts,tsx}'],
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports' },
            ],
        },
    },
);
