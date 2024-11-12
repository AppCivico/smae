<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';

const { params } = useRoute();
const distribuicaoRecursosStore = useDistribuicaoRecursosStore();

onMounted(() => {
  if (params.recursoId) {
    distribuicaoRecursosStore.buscarItem(params.recursoId);
  }
});
</script>
