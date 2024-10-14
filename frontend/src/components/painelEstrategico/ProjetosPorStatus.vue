<template>
  <GraficoDashboard
    class="pb3"
    :option="projetosPorStatusChartOptions"
  />
</template>

<script setup>
import { computed } from 'vue';
import criaOpcoesDoGraficoDeProjetos from '@/helpers/criaOpcoesDoGraficoDeProjetos';
import GraficoDashboard from '@/components/graficos/GraficoDashboard.vue';

const props = defineProps({
  projetosPorStatus: {
    type: Array,
    required: true,
  },
});

const status = computed(() => props.projetosPorStatus.map((item) => item.status));
const quantidades = computed(() => props.projetosPorStatus.map((item) => item.quantidade));

const projetosPorStatusChartOptions = computed(
  () => criaOpcoesDoGraficoDeProjetos(status.value, quantidades.value),
);

</script>

<style scoped>
</style>
