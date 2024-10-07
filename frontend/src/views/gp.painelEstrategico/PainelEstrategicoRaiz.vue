<script setup>
import { Dashboard } from '@/components';
import TotalDeProjetos from '@/components/painelEstrategico/TotalDeProjetos.vue';

</script>
<template>
  <Dashboard>
    <header class="flex spacebetween center mb2">
      <TítuloDePágina />
      <hr class="ml2 f1">
    </header>
    <TotalDeProjetos />
  </Dashboard>
</template>
