<script setup>
import { Dashboard } from '@/components';
import { useRelatoriosStore } from '@/stores';

const relaóriosStore = useRelatoriosStore();
relaóriosStore.clear();
relaóriosStore.filterRelatorios();
</script>
<template>
  <Dashboard>
    <router-view />
  </Dashboard>
</template>
