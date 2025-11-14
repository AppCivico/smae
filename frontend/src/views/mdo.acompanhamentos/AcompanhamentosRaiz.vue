<script setup>
import { onUnmounted } from 'vue';

import { useAcompanhamentosStore } from '@/stores/acompanhamentos.store.ts';
import { useTiposDeAcompanhamentoStore } from '@/stores/tiposDeAcompanhamento.store.ts';

const acompanhamentosStore = useAcompanhamentosStore();
const tiposDeAcompanhamentoStore = useTiposDeAcompanhamentoStore();

if (!tiposDeAcompanhamentoStore.lista.length) {
  tiposDeAcompanhamentoStore.buscarTudo();
}

onUnmounted(() => {
  acompanhamentosStore.$reset();
  tiposDeAcompanhamentoStore.$reset();
});
</script>
<template>
  <router-view />
</template>
