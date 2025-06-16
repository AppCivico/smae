<script setup lang="ts">
import MonitoramentoCards from '@/components/transferencia/MonitoramentoCards.vue';
import VaralDeEtapas from '@/components/transferencia/VaralDeEtapas.vue';
import VaralDeFases from '@/components/TransferenciasVoluntarias/Monitoramento.componentes/VaralDeFases/VaralDeFases.vue';

</script>

<template>
  <CabecalhoDePagina />

  <div class="flex g3 column">
    <MonitoramentoCards />

    <VaralDeEtapas />

    <VaralDeFases class="mt2" />
  </div>
</template>
