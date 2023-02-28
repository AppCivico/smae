/* eslint-disable import/extensions */
// @ts-ignore
import requestS from '@/helpers/requestS.ts';
// usamos o `.ts` aqui para não entrar em conflito com a versão JS ainda usada
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import type { Router } from 'vue-router';
import { useRoute } from 'vue-router';
import App from './App.vue';
import { router } from './router';

const app = createApp(App);
const pinia = createPinia();

interface RequestS {
  get: (url: RequestInfo | URL, params?: URLSearchParams | {} | undefined) => Promise<any>;
  post: (url: RequestInfo | URL, params: URLSearchParams | {} | undefined) => Promise<any>;
  upload: (url: RequestInfo | URL, params: URLSearchParams | {} | undefined) => Promise<any>;
  put: (url: RequestInfo | URL, params: URLSearchParams | {} | undefined) => Promise<any>;
  patch: (url: RequestInfo | URL, params: URLSearchParams | {} | undefined) => Promise<any>;
  delete: (url: RequestInfo | URL, params?: URLSearchParams | {} | undefined) => Promise<any>;
}

declare module 'pinia' {
  export interface PiniaCustomProperties {
    requestS: RequestS;
    router: Router;
  }
}

pinia.use(({ store }) => {
  // eslint-disable-next-line no-param-reassign
  store.route = useRoute();
  return { requestS };
});

app.config.globalProperties.requestS = requestS;

app.use(pinia);
app.use(router);
app.mount('#app');
