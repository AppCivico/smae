<script setup>
import { useProcessosStore } from '@/stores/processos.store.ts';

const processosStore = useProcessosStore();
const props = defineProps({
  processoId: {
    type: Number,
    default: 0,
  },
});

if (processosStore.emFoco?.id !== Number(props.processoId)) {
  processosStore.$reset();

  processosStore.buscarItem(props.processoId);
}
</script>
<template>
  <router-view />
</template>
