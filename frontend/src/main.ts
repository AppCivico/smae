import type { Store } from 'pinia';
import { createPinia } from 'pinia';
import {
  createApp, markRaw, nextTick,
} from 'vue';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';
import CheckClose from '@/components/CheckClose.vue';
import ErrorComponent from '@/components/ErrorComponent.vue';
import FormErrorsList from '@/components/FormErrorsList.vue';
import SmaeLabel from '@/components/camposDeFormulario/SmaeLabel.vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import MigalhasDePão from '@/components/MigalhasDePao.vue';
import SmaeLink from '@/components/SmaeLink.vue';
import SmaeFieldsetSubmit from '@/components/SmaeFieldsetSubmit.vue';
import SmaeText from '@/components/camposDeFormulario/SmaeText.vue';
import TítuloDePágina from '@/components/TituloDaPagina.vue';
import detectarPosicaoCongelada from '@/diretivas/detectarPosicaoCongelada';
import selecionarMultiplasOpcoes from '@/diretivas/selecionarMultiplasOpcoes';
import type { RequestS } from '@/helpers/requestS';
import requestS from '@/helpers/requestS';
import consoleNaTemplate from '@/plugins/consoleNaTemplate';
import App from './App.vue';
import CabecalhoDePagina from './components/CabecalhoDePagina.vue';
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
    resetAllStores: (storeIds: string | string[]) => void;
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
    resetAllStores: (storeIds = 'all') => {
      stores.forEach((eachStore) => {
        switch (true) {
          case storeIds === 'all':
          case Array.isArray(storeIds) && storeIds.includes(eachStore.$id):
          case storeIds === eachStore.$id:
            if (eachStore.$reset) {
              eachStore.$reset();
            }
            break;

          default:
            break;
        }
      });
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
  mounted: (el, binding) => selecionarMultiplasOpcoes(el, binding.value),
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
app.component('SmaeFieldsetSubmit', SmaeFieldsetSubmit);
app.component('LabelFromYup', SmaeLabel);
app.component('SmaeLabel', SmaeLabel);
app.component('LoadingComponent', LoadingComponent);
app.component('MigalhasDePão', MigalhasDePão);
app.component('MigalhasDePao', MigalhasDePão);
app.component('SmaeLink', SmaeLink);
app.component('SmaeText', SmaeText);
app.component('TítuloDePágina', TítuloDePágina);
app.component('TituloDePagina', TítuloDePágina);
app.component('TituloDaPagina', TítuloDePágina);
app.component('CabecalhoDePagina', CabecalhoDePagina);

app.use(pinia);
app.use(router);
app.mount('#app');
