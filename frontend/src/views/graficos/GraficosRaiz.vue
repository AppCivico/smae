<script setup>
import { Dashboard } from '@/components';
import GraficosTransferenciasVoluntarias from './GraficosTransferenciasVoluntarias.vue';

</script>
<template>
  <Dashboard class="dashboard--graficos">
    <div class="flex spacebetween center flexwrap">
      <header>
        <TítuloDePágina>
          Painel Estratégico
        </TítuloDePágina>
      </header>
    </div>
    <GraficosTransferenciasVoluntarias />
  </Dashboard>
</template>
<style lang="less">
.dashboard--graficos {
  background-image: url('@{u}graficos__lines.svg'),
  linear-gradient(to right, #fdf4d8, #b3bbc6);
  background-repeat: no-repeat;
  background-size: cover;
}
</style>
