<script setup>
import { usePlanosSimplificadosStore } from '@/stores/planosMetasSimplificados.store';
import { storeToRefs } from 'pinia';

const planosMetasSimplificadosStore = usePlanosSimplificadosStore();

const { planosSimplificados } = storeToRefs(planosMetasSimplificadosStore);

if (!planosSimplificados.value.length) {
  planosMetasSimplificadosStore.buscarPlanos({ apenas_pdm: false });
}
</script>
<template>
  <router-view />
</template>
