<template>
  <router-view />
</template>

<script setup>
import { watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

const route = useRoute();
const distribuicaoRecursosStore = useDistribuicaoRecursosStore();
const transferenciasVoluntariasStore = useTransferenciasVoluntariasStore();

const { emFoco: transferenciaEmFoco } = storeToRefs(transferenciasVoluntariasStore);

watch(() => route.params.transferenciaId, (novoTransferenciaId) => {
  if (novoTransferenciaId !== transferenciaEmFoco.value?.id) {
    transferenciasVoluntariasStore.buscarItem(novoTransferenciaId);
  }
}, { immediate: true });

watch(() => route.params.recursoId, (novoRecursoId) => {
  if (novoRecursoId) {
    distribuicaoRecursosStore.buscarItem(novoRecursoId);
  }
}, { immediate: true });
</script>
