<script setup>
import { onUnmounted } from 'vue';

import { useTarefasStore } from '@/stores/tarefas.store.ts';

const tarefasStore = useTarefasStore();

onUnmounted(() => { tarefasStore.$reset(); });
</script>
<template>
  <router-view />
</template>
