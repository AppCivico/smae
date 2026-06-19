import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

function getLastCommitDate(folder) {
  try {
    const result = spawnSync('git', ['log', '-1', '--format=%ci', '--', folder], {
      encoding: 'utf-8',
      cwd: repoRoot,
    });
    return (result.stdout || '').trim().slice(0, 16);
  } catch {
    return '';
  }
}

const htmlPlugin = () => ({
  name: 'html-transform',
  transformIndexHtml(html) {
    return html.replace(
      /__FORMULA_JS_SCRIPT__/,
      `<script type="text/javascript" src="${process.env.FORMULA_JS_URL || '/api/public/js/formula_parser.js'}"></script>`,
    );
  },
});

const frontendDate = getLastCommitDate('frontend');
const backendDate = getLastCommitDate('backend');

// eslint-disable-next-line no-console
console.log('[vite] commit dates — front:', frontendDate || '(vazio)', '| back:', backendDate || '(vazio)');

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __FRONTEND_COMMIT_DATE__: JSON.stringify(frontendDate),
    __BACKEND_COMMIT_DATE__: JSON.stringify(backendDate),
  },
  css: {
    preprocessorOptions: {
      less: {
        additionalData: '@import "@/_less/variables.less";',
      },
    },
  },
  plugins: [htmlPlugin(), vue(), legacy()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@back': fileURLToPath(new URL('../backend/src', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
  },
});
