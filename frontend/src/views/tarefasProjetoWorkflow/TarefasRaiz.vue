<script setup>
import { useTarefasProjetosStore } from '@/stores/tarefasProjeto.store.js';
import { onUnmounted} from 'vue';
const tarefasProjetos = useTarefasProjetosStore();

tarefasProjetos.buscarTudo();
onUnmounted(() => { tarefasProjetos.$reset(); });
</script>
<template>
  <router-view />
</template>
