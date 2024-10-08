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

    <div class="lista-de-cartoes">
      <TotalDeProjetos />
    </div>
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
  gap: 4rem 2rem;
}
</style>
