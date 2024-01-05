<script setup>
import { useTiposDeAcompanhamentoStore } from '@/stores/tiposDeAcompanhamento.store.ts';

const tiposDeAcompanhamentoStore = useTiposDeAcompanhamentoStore();

if (!tiposDeAcompanhamentoStore?.lista?.length) {
  tiposDeAcompanhamentoStore?.buscarTudo();
}
</script>
<template>
  <router-view />
</template>
