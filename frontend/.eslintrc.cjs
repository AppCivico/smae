/* eslint-env node */
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'plugin:vue/vue3-recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@', './frontend/src'],
        ],
        extensions: ['.js', '.vue'],
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
    },
  ],
};
