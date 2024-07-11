<script setup>
import { useContratosStore } from '@/stores/contratos.store.ts';

const contratosStore = useContratosStore();
const props = defineProps({
  processoId: {
    type: Number,
    default: 0,
  },
});

if (contratosStore.emFoco?.id !== Number(props.processoId)) {
  contratosStore.$reset();

  contratosStore.buscarItem(props.processoId);
}
</script>
<template>
  <router-view />
</template>
