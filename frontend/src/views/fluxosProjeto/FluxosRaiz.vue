<script setup>
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';
import { onUnmounted } from 'vue';

const fluxosProjetoStore = useFluxosProjetosStore();

fluxosProjetoStore.buscarTudo();
onUnmounted(() => { fluxosProjetoStore.$reset(); });
</script>
<template>
  <router-view />
</template>
