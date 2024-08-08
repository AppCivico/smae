/* eslint-env node */
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'airbnb-typescript/base',
    '@vue/eslint-config-typescript/recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    '@vue/eslint-config-prettier/skip-formatting',
    '@vue/eslint-config-typescript',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    project: [
      './frontend/tsconfig.json',
    ],
    parser: '@typescript-eslint/parser',
  },
  rules: {
    'import/extensions': [
      'error', {
        ts: 'always',
        vue: 'always',
      },
    ],
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@', './frontend/src'],
        ],
        extensions: ['.js', '.ts', '.vue'],
      },
    },
    'import/core-modules': [
      'vite',
      '@vitejs/plugin-vue',
    ],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        'eslint:recommended',
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:vue/vue3-recommended',
      ],
      plugins: [
        '@typescript-eslint',
      ],
      parserOptions: {
        ecmaVersion: 'latest',
        parser: '@typescript-eslint/parser',
        project: './frontend/tsconfig.json',
      },
      rules: {
        '@typescript-eslint/member-delimiter-style': 'warn',
      },
    },
    {
      files: ['*.store.js', '*.store.ts'],
      rules: {
        'import/prefer-default-export': 'off',
        'import/extensions': [
          'error', {
            ts: 'never',
          },
        ],
      },
    },
  ],
};
