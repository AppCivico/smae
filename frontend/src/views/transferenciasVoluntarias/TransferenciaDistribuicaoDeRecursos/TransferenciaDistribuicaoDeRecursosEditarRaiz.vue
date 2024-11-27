<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

const { params } = useRoute();
const distribuicaoRecursosStore = useDistribuicaoRecursosStore();
const transferenciasVoluntariasStore = useTransferenciasVoluntariasStore();

onMounted(() => {
  transferenciasVoluntariasStore.buscarItem(params.transferenciaId);

  if (params.recursoId) {
    distribuicaoRecursosStore.buscarItem(params.recursoId);
  }
});
</script>
