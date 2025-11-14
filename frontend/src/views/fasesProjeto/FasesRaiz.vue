<script setup>
import { onUnmounted } from 'vue';

import { useFasesProjetosStore } from '@/stores/fasesProjeto.store.js';

const fasesProjetosStore = useFasesProjetosStore();

fasesProjetosStore.buscarTudo();
onUnmounted(() => { fasesProjetosStore.$reset(); });
</script>
<template>
  <router-view />
</template>
