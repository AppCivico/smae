<script setup>
import Dashboard from '@/components/DashboardLayout.vue';
import TotalDeProjetos from '@/components/painelEstrategico/TotalDeProjetos.vue';

</script>
<template>
  <Dashboard>
    <header class="flex spacebetween center mb2">
      <TítuloDePágina />
      <hr class="ml2 f1">
    </header>

    <div class="lista-de-cartoes g2">
      <TotalDeProjetos />
    </div>
  </Dashboard>
</template>
<style lang="less" scoped>
.lista-de-cartoes {}
</style>
