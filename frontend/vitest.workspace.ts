// eslint-disable-next-line import/no-extraneous-dependencies
import { defineWorkspace, mergeConfig } from 'vitest/config';
import configShared from './vite.config';

// defineWorkspace provides a nice type hinting DX
export default defineWorkspace([
  mergeConfig(
    configShared,
    {
      test: {
        include: [
          'src/**/*.{spec,test}.{ts,js}',
        ],
        name: 'front',
      },
    },
  ),
]);
