<template>
  <div
    role="region"
    aria-label="Gráfico de execução orçamentária"
    tabindex="0"
  >
    <div
      class="min-width"
      style="--min-width: 30rem;"
    >
      <GraficoDashboard
        class="pb3"
        :option="projetosPorStatusChartOptions"
        :tooltip-template="formatTooltip"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import criaOpcoesDoGraficoDeProjetos from '@/helpers/criaOpcoesDoGraficoDeProjetos';
import GraficoDashboard, { TooltipOptions } from '@/components/graficos/GraficoDashboard.vue';

const props = defineProps({
  projetosPorStatus: {
    type: Array,
    required: true,
  },
});

const status = computed(() => props.projetosPorStatus.map((item) => item.status));
const quantidades = computed(() => props.projetosPorStatus.map((item) => item.quantidade));
const total = computed(() => quantidades.value.reduce((acc, item) => acc + item, 0));

const projetosPorStatusChartOptions = computed(
  () => criaOpcoesDoGraficoDeProjetos(status.value, quantidades.value),
);

function calculaPorcentagem(valor: number) {
  return Math.round((valor / total.value) * 100);
}

function formatTooltip(param: TooltipOptions) {
  return `
    <div class="projeto-tooltip">
      <h5 class="projeto-tooltip__valor">${param.data}</h5>
      <h6 class="projeto-tooltip__label">${param.name}</h6>

      <span class="projeto-tooltip__porcentagem">
        ${calculaPorcentagem(param.data)}%
      </span>
    </div>
  `;
}
</script>
