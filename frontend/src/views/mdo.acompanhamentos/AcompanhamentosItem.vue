<script setup>
import { onUnmounted } from 'vue';

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

// Ao sair do registro (este wrapper envolve edição e resumo), limpa o
// acompanhamento em foco. Assim, a próxima tela — em especial "Novo registro" —
// não herda os dados do registro que estava sendo visto.
onUnmounted(() => {
  acompanhamentosStore.emFoco = null;
});
</script>
<template>
  <router-view />
</template>
