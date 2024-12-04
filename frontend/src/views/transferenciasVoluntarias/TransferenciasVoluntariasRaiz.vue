<script setup>
import { Dashboard } from '@/components';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { onUnmounted } from 'vue';

const transferenciasVoluntarias = useTransferenciasVoluntariasStore();

onUnmounted(() => { transferenciasVoluntarias.$reset(); });
</script>
<template>
  <Dashboard>
    <MigalhasDePão class="mb1" />
    <router-view />
  </Dashboard>
</template>
