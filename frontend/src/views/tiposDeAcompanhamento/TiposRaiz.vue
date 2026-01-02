<script setup>
import { useTiposDeAcompanhamentoStore } from '@/stores/tiposDeAcompanhamento.store.ts';

const tiposDeAtendimentoStore = useTiposDeAcompanhamentoStore();

tiposDeAtendimentoStore.$reset();
tiposDeAtendimentoStore.buscarTudo();
</script>
<template>
  <MigalhasDePao />

  <router-view />
</template>
