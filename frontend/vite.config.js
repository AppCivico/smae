import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
const htmlPlugin = () => {
    return {
        name: 'html-transform',
        transformIndexHtml(html) {
            return html.replace(
                /__FORMULA_JS_SCRIPT__/,
                `<script type="text/javascript" src="${process.env.FORMULA_JS_URL || '/api/public/js/formula_parser.js'}"></script>`
            )
        }
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [htmlPlugin(), vue()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
})
