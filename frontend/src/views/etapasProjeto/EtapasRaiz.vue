<script setup>
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';
import { onUnmounted } from 'vue';

const etapasProjetosStore = useEtapasProjetosStore();

etapasProjetosStore.buscarTudo();

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
