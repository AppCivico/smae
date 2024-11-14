/* eslint-env node */
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-typescript/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    parser: '@typescript-eslint/parser',
  },
  rules: {
    'import/extensions': [
      'error', {
        ts: 'warn', // TO-DO: voltar e resolver esse valor falso
        vue: 'always',
      },
    ],
    'no-param-reassign': [
      'error', {
        props: false,
      },
    ],
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@', './src'],
          ['@back', '../backend/src'],
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
      files: ['*.test.js', '*.test.ts'],
      extends: [
        'eslint:recommended',
        'airbnb-base',
      ],
      rules: {
        'import/no-extraneous-dependencies': [
          'off',
        ],
      },
    },
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
