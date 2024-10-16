<script setup>
import Dashboard from '@/components/DashboardLayout.vue';
import TotalDeProjetos from '@/components/painelEstrategico/TotalDeProjetos.vue';
import HeatMapGraph from '@/components/HeatMapGraph.vue';

</script>
<template>
  <Dashboard>
    <header class="flex spacebetween center mb2">
      <TítuloDePágina />
      <hr class="ml2 f1">
    </header>

    <div class="lista-de-cartoes">
      <TotalDeProjetos />
    </div>
    <TotalDeProjetos />
    <HeatMapGraph />
    </Dashboard>
</template>
<style lang="less">
.pagina-de-painel-estrategico {
  background-image: url("@{u}painel-estrategico/mapa-cinza.png");
  background-size: cover;
}

.pagina-de-painel-estrategico body {
  background-color: rgba(255, 255, 255, 0.7);
}
</style>
<style lang="less" scoped>
.lista-de-cartoes {
  display: grid;
  gap: 2rem 4rem;
}
</style>
