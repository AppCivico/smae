<script setup>
import { useFasesProjetosStore } from '@/stores/fasesProjeto.store.js';
import { onUnmounted} from 'vue';
const fasesProjetosStore = useFasesProjetosStore();

fasesProjetosStore.buscarTudo();
onUnmounted(() => { fasesProjetosStore.$reset(); });
</script>
<template>
  <router-view />
</template>
