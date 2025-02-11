<script setup>
import Dashboard from '@/components/DashboardLayout.vue';
import { useProjetosStore } from '@/stores/projetos.store';

const projetosStore = useProjetosStore();

projetosStore.buscarTudoV2();
</script>
<template>
  <Dashboard>
    <MigalhasDePão class="mb1" />
    <router-view />
  </Dashboard>
</template>
