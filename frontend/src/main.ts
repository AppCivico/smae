import CheckClose from '@/components/CheckClose.vue';
import detectarPosicaoCongelada from '@/diretivas/detectarPosicaoCongelada';
import ErrorComponent from '@/components/ErrorComponent.vue';
import FormErrorsList from '@/components/FormErrorsList.vue';
import LabelFromYup from '@/components/LabelFromYup.vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import MigalhasDePão from '@/components/MigalhasDePao.vue';
import SmaeLink from '@/components/SmaeLink.vue';
import TítuloDePágina from '@/components/TituloDaPagina.vue';
import selecionarMultiplasOpcoes from '@/diretivas/selecionarMultiplasOpcoes';
import type { RequestS } from '@/helpers/requestS';
import requestS from '@/helpers/requestS';
import consoleNaTemplate from '@/plugins/consoleNaTemplate';
import type { Store } from 'pinia';
import { createPinia } from 'pinia';
import {
  createApp, markRaw, nextTick,
} from 'vue';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';
import App from './App.vue';
import { router } from './router';

const app = createApp(App);

app.config.errorHandler = (err, instance, info) => {
  if (console.trace) {
    console.error(err);
    console.trace(err);
  } else {
    console.log('WARN: ', info);
    console.log('TRACE: ', instance);
    console.log('ERROR:', err);
  }
};

app.config.globalProperties.gblHabilitarBeta = import.meta.env.VITE_HABILITAR_BETA || false;
app.config.globalProperties.gblIpp = Number.parseInt(import.meta.env.VITE_PAGINACAO, 10) || 100;
app.config.globalProperties.gblLimiteDeSeleçãoSimultânea = Number.parseInt(
  import.meta.env.VITE_LIMITE_SELECAO,
  10,
)
  || undefined;

const pinia = createPinia();

declare module 'pinia' {
  export interface PiniaCustomProperties {
    requestS: RequestS;
    router: Router;
    route: RouteLocationNormalizedLoaded;
    resetAllStores: () => void;
  }
  export interface PiniaCustomStateProperties {
    route: RouteLocationNormalizedLoaded;
  }
}

const stores:Store[] = [];

pinia.use(() => ({
  router: markRaw(router),
  route: (markRaw(router).currentRoute) as unknown as RouteLocationNormalizedLoaded,
  requestS: markRaw(requestS),
}));

// @see https://github.com/vuejs/pinia/discussions/693#discussioncomment-1401218
pinia.use(({ store }) => {
  stores.push(store);

  return {
    resetAllStores: () => {
      stores.forEach((eachStore) => {
        eachStore.$reset();
      });

      stores.splice(0);
    },
  };
});

app.directive('ScrollLockDebug', {
  beforeMount: (el, binding) => {
    const primária = 'Control';
    const secundária = 'CapsLock';

    el.classList.add('debug');
    el.setAttribute('hidden', '');
    let secundáriaPressionada = false;

    if (binding.value) {
      el.setAttribute('data-debug', binding.value);
    }
    window.addEventListener('keydown', (event) => {
      if (event.getModifierState && event.getModifierState(primária)) {
        if (event.key === secundária) {
          if (secundáriaPressionada) {
            if (el.hasAttribute('hidden')) {
              el.removeAttribute('hidden');
            } else {
              el.setAttribute('hidden', '');
            }
            secundáriaPressionada = false;
          } else {
            secundáriaPressionada = true;
            setTimeout(() => {
              secundáriaPressionada = false;
            }, 300);
          }
        } else if (secundáriaPressionada) {
          secundáriaPressionada = false;
        }
      }
    });
  },
});

app.directive('selecionar-multiplas-opcoes', {
  mounted: (el) => selecionarMultiplasOpcoes(el),
});

app.directive('detectar-posicao-congelada', detectarPosicaoCongelada);

app.directive('focus', {
  mounted: async (el, binding) => {
    const { modifiers, value } = binding;

    if (!!value || value === undefined) {
      await nextTick();
      el.focus();
      if (modifiers.select && el instanceof HTMLInputElement) {
        el.select();
      }
    }
  },
});

app.use(consoleNaTemplate);

app.component('CheckClose', CheckClose);
app.component('ErrorComponent', ErrorComponent);
app.component('FormErrorsList', FormErrorsList);
app.component('LabelFromYup', LabelFromYup);
app.component('LoadingComponent', LoadingComponent);
app.component('MigalhasDePão', MigalhasDePão);
app.component('MigalhasDePao', MigalhasDePão);
app.component('SmaeLink', SmaeLink);
app.component('TítuloDePágina', TítuloDePágina);
app.component('TituloDePagina', TítuloDePágina);

app.use(pinia);
app.use(router);
app.mount('#app');
