import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const htmlPlugin = () => ({
  name: 'html-transform',
  transformIndexHtml(html) {
    return html.replace(
      /__FORMULA_JS_SCRIPT__/,
      `<script type="text/javascript" src="${process.env.FORMULA_JS_URL || '/api/public/js/formula_parser.js'}"></script>`,
    );
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      less: {
        additionalData: '@import "@/_less/variables.less";',
      },
    },
  },
  plugins: [htmlPlugin(), vue()],
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
