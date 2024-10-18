<template>
  <div
    role="region"
    aria-label="Gráfico de projetos por orgão responsável"
    tabindex="0"
  >
    <div
      class="min-width"
      style="--min-width: 30rem;"
    >
      <GraficoDashboard
        class="pb3"
        :option="projetosPorOrgaoResponsavelChartOptions"
        :tooltip-template="formatTooltip"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, computed } from 'vue';
import criaOpcoesDoGraficoDeProjetos from '@/helpers/criaOpcoesDoGraficoDeProjetos';
import GraficoDashboard, { TooltipOptions } from '@/components/graficos/GraficoDashboard.vue';

const props = defineProps({
  projetosOrgaoResponsavel: {
    type: Array,
    required: true,
  },
});

const projetosPorOrgaoResponsavelChartOptions = computed(() => ({
  grid: {
    top: '3%',
    left: '3%',
    right: '10%',
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'value',
    boundaryGap: [0, 0.01],
    splitLine: {
      show: false,
    },
    axisLabel: {
      show: false,
    },
  },
  yAxis: {
    type: 'category',
    data: props.projetosOrgaoResponsavel.map((item) => item.orgao_sigla),
    inverse: true,
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      fontFamily: 'Roboto',
      fontWeight: 600,
      color: '#142133',
      fontSize: 14,
    },
  },
  series: [
    {
      type: 'bar',
      data: props.projetosOrgaoResponsavel.map((item) => ({
        value: item.quantidade,
        descricao: item.orgao_descricao,
      })),
      itemStyle: {
        color: '#1c2e46',
        borderRadius: [0, 999, 999, 0],
      },
      barWidth: 30,
      label: {
        show: true,
        position: 'right',
        formatter: '{c}',
        fontSize: 15,
        color: '#221f43',
        distance: 5,
        fontFamily: 'Roboto Slab',
        fontWeight: 'bold',
      },
      emphasis: {
        focus: 'series',
      },
    },
  ],
}));

function formatTooltip(param: TooltipOptions) {
  return `
    <div class="projeto-tooltip">
      <h5 class="projeto-tooltip__valor">${param.data.value}</h5>
      <h6 class="projeto-tooltip__label">${param.data.descricao}</h6>
    </div>
  `;
}

</script>
