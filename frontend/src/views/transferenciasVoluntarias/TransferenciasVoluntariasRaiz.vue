<script setup>
import { onUnmounted } from 'vue';

import { Dashboard } from '@/components';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

const transferenciasVoluntarias = useTransferenciasVoluntariasStore();

onUnmounted(() => { transferenciasVoluntarias.$reset(); });
</script>
<template>
  <Dashboard>
    <MigalhasDePão class="mb1" />
    <router-view />
  </Dashboard>
</template>
