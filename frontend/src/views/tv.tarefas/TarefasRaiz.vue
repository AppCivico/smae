<script setup>
import { useWorkflowTarefasStore } from '@/stores/workflowTarefas.store';
import { onUnmounted } from 'vue';

const workflowTarefas = useWorkflowTarefasStore();

workflowTarefas.buscarTudo();
onUnmounted(() => {
  workflowTarefas.$reset();
});
</script>
<template>
  <router-view />
</template>
