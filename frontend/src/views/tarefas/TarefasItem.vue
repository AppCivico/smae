<script setup>
import { useTarefasStore } from '@/stores/tarefas.store.ts';

const tarefasStore = useTarefasStore();
const props = defineProps({
  tarefaId: {
    type: Number,
    default: 0,
  },
});

if (tarefasStore.emFoco?.id !== props.tarefaId) {
  tarefasStore.$reset();

  tarefasStore.buscarItem(props.tarefaId);
}
</script>
<template>
  <router-view />
</template>
