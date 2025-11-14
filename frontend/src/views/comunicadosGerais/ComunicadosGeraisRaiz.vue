<script setup>
import { onUnmounted } from 'vue';

import { Dashboard } from '@/components';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

const transferenciasVoluntarias = useTransferenciasVoluntariasStore();

onUnmounted(() => { transferenciasVoluntarias.$reset(); });
</script>
<template>
  <Dashboard>
    <router-view />
  </Dashboard>
</template>
