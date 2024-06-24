<script setup>
import { useAcompanhamentosStore } from '@/stores/acompanhamentos.store.ts';

const acompanhamentosStore = useAcompanhamentosStore();
const props = defineProps({
  acompanhamentoId: {
    type: Number,
    default: 0,
  },
});

if (acompanhamentosStore.emFoco?.id !== Number(props.acompanhamentoId)) {
  acompanhamentosStore.$reset();

  acompanhamentosStore.buscarItem(props.acompanhamentoId);
}
</script>
<template>
  <router-view />
</template>
