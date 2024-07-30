<script setup>
import Dashboard from '@/components/DashboardLayout.vue';

</script>
<template>
  <Dashboard>
    <MigalhasDePão
      v-if="!$route.meta.desabilitarMigalhasDePãoPadrão"
      class="mb1"
    />
    <router-view />
  </Dashboard>
</template>
