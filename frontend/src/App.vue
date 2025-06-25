<script setup>
import {
  onErrorCaptured,
  provide,
  ref,
} from 'vue';
import { Alert, EditModal, SideBar } from '@/components';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import BarraDePendência from './components/BarraDeChamadaPendente.vue';
import BotaoWiki from './components/BotaoWiki.vue';

const gblLimiteDeSeleçãoSimultânea = Number.parseInt(
  import.meta.env.VITE_LIMITE_SELECAO,
  10,
)
  || undefined;

provide('gblLimiteDeSeleçãoSimultânea', gblLimiteDeSeleçãoSimultânea);

const alertStore = useAlertStore();

const authStore = useAuthStore();
if (authStore.estouAutenticada) {
  authStore.getDados();
}

const erro = ref(null);
onErrorCaptured((err) => {
  if (
    err?.message?.includes('Failed to fetch dynamically imported module')
    || err?.message?.includes('Failed to load module script')
    || err?.message?.includes('error loading dynamically imported module')
    || err?.type === 'NAVIGATION_ABORTED'
    || err?.type === 4
  ) {
    alertStore.confirmAction('O sistema mudou de versão. Quer recarregar a página?', () => {
      window.location.reload();
    });
  } else if (import.meta.env.VITE_EXPOR_ERROS === 'true' || import.meta.env.DEV) {
    erro.value = err;
    console.trace(err);
  }
});

let corDaFaixa = '';

if (import.meta.env.VITE_COR_DA_FAIXA_DE_CONSTRUCAO || import.meta.env.DEV || ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  corDaFaixa = import.meta.env.VITE_COR_DA_FAIXA_DE_CONSTRUCAO
    ? `#${import.meta.env.VITE_COR_DA_FAIXA_DE_CONSTRUCAO}`
    : '#f2ff00';

  window.document.documentElement.classList.add('dev-environment');
}
</script>

<template>
  <span
    v-ScrollLockDebug
    class="tr mr2"
  >
    {{ rotaAtual?.path }}
  </span>
  <component
    :is="`style`"
    v-if="corDaFaixa"
  >
    .dev-environment:root body::after {
    background-color: v-bind(corDaFaixa) !important;
    }
  </component>

  <ErrorComponent
    v-if="erro"
    class="pl5"
  >
    <div class="flex spacebetween center pl1">
      {{ erro }}
      <button
        class="like-a__link tprimary"
        aria-label="Fechar erro"
        title="Fechar erro"
        @click="erro = null"
      >
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_remove" />
        </svg>
      </button>
    </div>
  </ErrorComponent>
  <BarraDePendência />
  <!-- vamos avançar até essa chave ser desnecessária para o sistema todo -->
  <router-view v-if="$route.meta.rotaPrescindeDeChave ?? gblHabilitarBeta" />
  <router-view
    v-else
    :key="$route.path"
  />

  <SideBar />

  <EditModal />
  <Alert />
  <div id="modais" />

  <BotaoWiki />
</template>
<style lang="less">
@import url("@/_less/style.less");
</style>
