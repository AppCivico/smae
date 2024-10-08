<script setup>
import TotalDeProjetos from '@/components/painelEstrategico/TotalDeProjetos.vue';
import { Dashboard } from '@/components';

</script>
<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <h1>Painel estratégico</h1>
      <hr class="ml2 f1">
    </div>
    <TotalDeProjetos />
  </Dashboard>
</template>
