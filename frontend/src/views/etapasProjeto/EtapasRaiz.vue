<script setup>
import { onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';
import MigalhasDePao from '@/components/MigalhasDePao.vue';

const route = useRoute();
const etapasProjetosStore = useEtapasProjetosStore(route.meta.entidadeMãe);

etapasProjetosStore.buscarTudo();

onUnmounted(() => {
  etapasProjetosStore.$reset();
});
</script>
<template>
  <MigalhasDePao/>
  <ErrorComponent
    v-if="etapasProjetosStore.erro"
    class="fb100 mb1"
  >
    {{ etapasProjetosStore.erro }}
  </ErrorComponent>

  <router-view />
</template>
