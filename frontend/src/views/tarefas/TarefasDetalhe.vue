<template>
  <div>
    emFoco: <pre>{{ emFoco }}</pre>
  </div>
</template>
<script setup>
import { storeToRefs } from 'pinia';
import { useTarefasStore } from '@/stores/tarefas.store.ts';

const tarefasStore = useTarefasStore();

const {
  chamadasPendentes,
  emFoco,
  erro,
} = storeToRefs(tarefasStore);

</script>

<style>

</style>
