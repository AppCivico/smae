<script setup>
import { onUnmounted } from 'vue';

import { useWorkflowTarefasStore } from '@/stores/workflowTarefas.store';

const workflowTarefas = useWorkflowTarefasStore();

workflowTarefas.buscarTudo();
onUnmounted(() => {
  workflowTarefas.$reset();
});
</script>
<template>
  <router-view />
</template>
