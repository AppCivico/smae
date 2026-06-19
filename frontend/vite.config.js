import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

function getLastCommitDate(dir) {
  const result = spawnSync('git', ['log', '-1', '--format=%ci', '--', '.'], {
    encoding: 'utf-8',
    cwd: dir,
  });
  // eslint-disable-next-line no-console
  console.log(`[vite] git log em ${dir}: status=${result.status} stdout="${result.stdout?.trim()}" stderr="${result.stderr?.trim()}" error=${result.error?.message}`);
  return (result.stdout || '').trim().slice(0, 16);
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

// eslint-disable-next-line no-console
console.log('[vite] import.meta.url:', import.meta.url);
// eslint-disable-next-line no-console
console.log('[vite] process.cwd():', process.cwd());

const frontendDir = fileURLToPath(new URL('.', import.meta.url));
const backendDir = fileURLToPath(new URL('../backend', import.meta.url));

const frontendDate = getLastCommitDate(frontendDir);
const backendDate = getLastCommitDate(backendDir);

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
