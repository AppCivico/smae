<script setup>
import { onUnmounted } from 'vue';

import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';

const fluxosProjetoStore = useFluxosProjetosStore();

fluxosProjetoStore.buscarTudo();
onUnmounted(() => { fluxosProjetoStore.$reset(); });
</script>
<template>
  <router-view />
</template>
