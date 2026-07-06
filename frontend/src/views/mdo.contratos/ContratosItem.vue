<script setup>
import { watch } from 'vue';
import { useRoute } from 'vue-router';

import { useContratosStore } from '@/stores/contratos.store.ts';

const route = useRoute();

const contratosStore = useContratosStore(route.meta.entidadeMãe);

const props = defineProps({
  contratoId: {
    type: Number,
    default: 0,
  },
});

watch(
  () => props.contratoId,
  (contratoId) => {
    if (contratosStore.emFoco?.id !== Number(contratoId)) {
      contratosStore.$reset();

      contratosStore.buscarItem(contratoId);
    }
  },
  { immediate: true },
);
</script>
<template>
  <router-view />
</template>
