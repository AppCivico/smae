import FormErrorsList from '@/components/FormErrorsList.vue';
import LabelFromYup from '@/components/LabelFromYup.vue';
// usamos o `.ts` aqui para não entrar em conflito com a versão JS ainda usada
// @ts-ignore
import requestS from '@/helpers/requestS.ts';
import { createPinia } from 'pinia';
import { createApp, markRaw } from 'vue';
import type { Router } from 'vue-router';
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
    route: Router['currentRoute'];
  }
  export interface PiniaCustomStateProperties {
    route: Router['currentRoute'];
  }
}

pinia.use(({ store }) => {
  // eslint-disable-next-line no-param-reassign
  store.route = router.currentRoute;
  return { requestS: markRaw(requestS) };
});

app.directive('ScrollLockDebug', {
  beforeMount: (el, binding) => {
    el.classList.add('debug');
    el.setAttribute('hidden', '');

    if (binding.value) {
      el.setAttribute('data-debug', binding.value);
    }
    window.addEventListener('keydown', (event) => {
      if (event.getModifierState && event.getModifierState('ScrollLock')) {
        el.removeAttribute('hidden', '');
      } else if (event.key === 'ScrollLock') {
        el.setAttribute('hidden', '');
      }
    });
  },
});

app.component('FormErrorsList', FormErrorsList);
app.component('LabelFromYup', LabelFromYup);

app.use(pinia);
app.use(router);
app.mount('#app');
