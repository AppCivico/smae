<script setup>
import { Alert, EditModal, SideBar } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { onErrorCaptured, provide, ref } from 'vue';
import BarraDePendência from './components/BarraDeChamadaPendente.vue';

const gblLimiteDeSeleçãoSimultânea = Number.parseInt(
  import.meta.env.VITE_LIMITE_SELECAO,
  10,
)
  || undefined;

provide('gblLimiteDeSeleçãoSimultânea', gblLimiteDeSeleçãoSimultânea);

const authStore = useAuthStore();
if (authStore.estouAutenticada) {
  authStore.getDados();
}

const erro = ref(null);

if (import.meta.env.VITE_EXPOR_ERROS === 'true' || import.meta.env.DEV) {
  onErrorCaptured((err) => {
    erro.value = err;
  });
}
</script>
<template>
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
        ><use xlink:href="#i_remove" /></svg>
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
</template>
<style lang="less">
@import url("@/_less/style.less");
</style>
