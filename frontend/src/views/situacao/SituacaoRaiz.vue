<script setup>
import { useSituacaoStore } from '@/stores/situacao.store.js';
import { onUnmounted} from 'vue';
const situacaoStore = useSituacaoStore();

situacaoStore.buscarTudo();
onUnmounted(() => { situacaoStore.$reset(); });
</script>
<template>
  <router-view />
</template>
