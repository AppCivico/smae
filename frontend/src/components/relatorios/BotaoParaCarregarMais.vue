<script setup>
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';

const relatóriosStore = useRelatoriosStore();
defineProps({
  fonte: {
    type: String,
    required: true,
  },
});
</script>
<template>
  <button
    v-if="relatóriosStore.paginação.temMais && relatóriosStore.paginação.tokenDaPróximaPágina"
    :disabled="relatóriosStore.loading"
    class="btn bgnone outline center"
    @click="relatóriosStore.getAll({
      ...$route.query,
      fonte: fonte,
      token_proxima_pagina: relatóriosStore.paginação.tokenDaPróximaPágina
    })"
  >
    carregar mais
  </button>
</template>
