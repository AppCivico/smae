const js = require('@eslint/js');
const globals = require('globals');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const unusedImports = require('eslint-plugin-unused-imports');
const noDecimalOperators = require('./eslint-rules/no-decimal-operators');

module.exports = [
    {
        ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'eslint.config.js', 'eslint-rules/**'],
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            sourceType: 'module',
            parserOptions: {
                project: 'tsconfig.json',
                tsconfigRootDir: __dirname,
            },
            globals: {
                ...globals.node,
                ...globals.es2022,
                ...globals.jest,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            'unused-imports': unusedImports,
            smae: { rules: { 'no-decimal-operators': noDecimalOperators } },
        },
        rules: {
            ...js.configs.recommended.rules,
            // desliga as regras core do ESLint que o TypeScript já cobre (no-undef, no-redeclare, ...).
            // No formato antigo isso vinha de graça via `extends: plugin:@typescript-eslint/recommended`.
            ...tsPlugin.configs['eslint-recommended'].overrides[0].rules,
            ...tsPlugin.configs.recommended.rules,

            'smae/no-decimal-operators': 'error',

            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unsafe-assignment': 'warn',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^(_|user$|config$)',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-non-null-assertion': 'off',
        },
    },
];
