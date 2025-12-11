<script setup>
import { onUnmounted } from 'vue';

import { useSituacaoStore } from '@/stores/situacao.store.js';

const situacaoStore = useSituacaoStore();

situacaoStore.buscarTudo();
onUnmounted(() => { situacaoStore.$reset(); });
</script>
<template>
  <router-view />
</template>
