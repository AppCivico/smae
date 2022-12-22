<script setup>
import { Dashboard } from '@/components';
import { useRelatoriosStore } from '@/stores';
import { onMounted } from 'vue';

const relatóriosStore = useRelatoriosStore();
onMounted(() => {
  relatóriosStore.clear();
  relatóriosStore.getAll();
});
</script>
<template>
  <Dashboard>
    <router-view />
  </Dashboard>
</template>
