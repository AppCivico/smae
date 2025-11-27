<script setup>
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

if (contratosStore.emFoco?.id !== Number(props.contratoId)) {
  contratosStore.$reset();

  contratosStore.buscarItem(props.contratoId);
}
</script>
<template>
  <router-view />
</template>
