<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

import { usePlanosSimplificadosStore } from '@/stores/planosMetasSimplificados.store';

const planosMetasSimplificadosStore = usePlanosSimplificadosStore(useRoute().meta.entidadeMãe);

const { planosSimplificados } = storeToRefs(planosMetasSimplificadosStore);

if (!planosSimplificados.value.length) {
  planosMetasSimplificadosStore.buscarPlanos({ apenas_pdm: false });
}
</script>
<template>
  <router-view />
</template>
