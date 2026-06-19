import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

function gitSpawn(args, cwd) {
  return spawnSync('git', args, { encoding: 'utf-8', cwd });
}

function getLastCommitDate(dir) {
  const result = gitSpawn(['log', '-1', '--format=%ci', '--', '.'], dir);
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

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const isShallow = gitSpawn(['rev-parse', '--is-shallow-repository'], repoRoot).stdout?.trim();

if (isShallow === 'true') {
  gitSpawn(['fetch', '--unshallow'], repoRoot);
}

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
