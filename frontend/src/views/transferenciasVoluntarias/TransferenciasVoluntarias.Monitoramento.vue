<script setup>
import MonitoramentoCards from '@/components/transferencia/MonitoramentoCards.vue';
import VaralDeEtapas from '@/components/transferencia/VaralDeEtapas.vue';

</script>
<template>
  <CabecalhoDePagina />

  <div class="flex g3 column">
    <MonitoramentoCards />

    <VaralDeEtapas />

    &lt;VaralDeFases/&gt;
  </div>
</template>
