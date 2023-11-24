<script setup>
import { Dashboard } from '@/components';
import { useTiposDeAcompanhamentoStore } from '@/stores/tiposDeAcompanhamento.store.ts';

const tiposDeAtendimentoStore = useTiposDeAcompanhamentoStore();

tiposDeAtendimentoStore.$reset();
tiposDeAtendimentoStore.buscarTudo();
</script>
<template>
  <Dashboard>
    <router-view />
  </Dashboard>
</template>
