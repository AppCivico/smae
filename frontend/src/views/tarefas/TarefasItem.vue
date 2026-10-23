<script setup>
import { useTarefasStore } from '@/stores/tarefas.store.ts';

const tarefasStore = useTarefasStore();
const props = defineProps({
  tarefaId: {
    type: Number,
    default: 0,
  },
});

// Só busca a tarefa se ela ainda não estiver em foco. A comparação é estrita, então
// depende de `tarefaId` chegar como número (ver `inheritAttrs` em `TarefasRaiz`).
if (tarefasStore.emFoco?.id !== props.tarefaId) {
  tarefasStore.$reset();

  tarefasStore.buscarItem(props.tarefaId);
}
</script>
<template>
  <router-view />
</template>
