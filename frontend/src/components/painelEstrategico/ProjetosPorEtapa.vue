<template>
  <GraficoDashboard
    class="pb3"
    :option="projetosPorEtapaChartOptions"
  />
</template>

<script setup>
import { defineProps, computed } from 'vue';
import criaOpcoesDoGraficoDeProjetos from '@/helpers/criaOpcoesDoGraficoDeProjetos';
import GraficoDashboard from '@/components/graficos/GraficoDashboard.vue';

const props = defineProps({
  projetosPorEtapas: {
    type: Array,
    required: true,
  },
});

const etapas = computed(() => props.projetosPorEtapas.map((item) => item.etapa));
const quantidades = computed(() => props.projetosPorEtapas.map((item) => item.quantidade));

const projetosPorEtapaChartOptions = computed(
  () => criaOpcoesDoGraficoDeProjetos(etapas.value, quantidades.value),
);

</script>
