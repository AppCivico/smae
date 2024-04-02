<script setup>
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store.js';
import { onUnmounted} from 'vue';
const etapasProjetosStore = useEtapasProjetosStore();

etapasProjetosStore.buscarTudo();
onUnmounted(() => { etapasProjetosStore.$reset(); });
</script>
<template>
  <router-view />
</template>
