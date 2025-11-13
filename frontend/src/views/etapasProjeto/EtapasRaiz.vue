<script setup>
import { computed, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

import configEtapas from '@/consts/configEtapas';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';

const route = useRoute();
const etapasProjetosStore = useEtapasProjetosStore(route.meta.entidadeMãe);

const contextoEtapa = computed(() => {
  if (route.meta.contextoEtapa) {
    return route.meta.contextoEtapa;
  }
  const config = configEtapas[route.meta.entidadeMãe];
  return config?.contextoEtapa || null;
});

if (contextoEtapa.value === 'administracao') {
  etapasProjetosStore.buscarEtapasPadrao();
} else if (contextoEtapa.value === 'configuracoes') {
  etapasProjetosStore.buscarTudo({ eh_padrao: false });
} else {
  // TransferenciasVoluntarias não tem filtro
  etapasProjetosStore.buscarTudo();
}

onUnmounted(() => {
  etapasProjetosStore.$reset();
});
</script>
<template>
  <ErrorComponent
    v-if="etapasProjetosStore.erro"
    class="fb100 mb1"
  >
    {{ etapasProjetosStore.erro }}
  </ErrorComponent>

  <router-view />
</template>
