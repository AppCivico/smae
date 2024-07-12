<script setup>
import { useContratosStore } from '@/stores/contratos.store.ts';

const contratosStore = useContratosStore();
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
