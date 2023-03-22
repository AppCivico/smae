import LabelFromYup from '@/components/LabelFromYup.vue';
// usamos o `.ts` aqui para não entrar em conflito com a versão JS ainda usada
// @ts-ignore
import requestS from '@/helpers/requestS.ts';
import { createPinia } from 'pinia';
import { createApp, markRaw } from 'vue';
import type { RouteLocationNormalized, Router } from 'vue-router';
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
    route: RouteLocationNormalized;
  }
  export interface PiniaCustomStateProperties {
    route: RouteLocationNormalized;
  }
}

pinia.use(({ store }) => {
  // eslint-disable-next-line no-param-reassign
  store.route = useRoute();
  return { requestS: markRaw(requestS) };
});

app.component('LabelFromYup', LabelFromYup);

app.use(pinia);
app.use(router);
app.mount('#app');
