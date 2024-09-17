<template>
  <Dashboard>
    <router-view />
  </Dashboard>
</template>
<script setup>
import { onUnmounted } from 'vue';
import { Dashboard } from '@/components';
import { useOportunidadesStore } from '@/stores/oportunidades.store';

const oportunidades = useOportunidadesStore();

onUnmounted(() => { oportunidades.$reset(); });
</script>
