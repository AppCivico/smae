<script setup>
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { onUnmounted } from 'vue';

const tarefasStore = useTarefasStore();

onUnmounted(() => { tarefasStore.$reset(); });
</script>
<template>
  <router-view />
</template>
