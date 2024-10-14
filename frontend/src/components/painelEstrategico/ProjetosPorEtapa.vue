<template>
  <GraficoDashboard
    class="pb3"
    :option="projetosPorEtapaChartOptions"
  />
</template>

<script setup>
import { defineProps, computed } from 'vue';

import GraficoDashboard from '@/components/graficos/GraficoDashboard.vue';

const props = defineProps({
  projetosPorEtapas: {
    type: Array,
    required: true,
  },
});

const etapas = computed(() => props.projetosPorEtapas.map((item) => item.etapa));
const quantidades = computed(() => props.projetosPorEtapas.map((item) => item.quantidade));

const projetosPorEtapaChartOptions = computed(() => ({
  color: [
    '#1b263b',
    '#221f43',
    '#2e4059',
    '#778da9',
    '#5c7490',
    '#acb7c3',
    '#e0e1dd',
  ],
  tooltip: {
    trigger: 'item',
  },
  grid: {
    left: '0', // Ajuste o espaço à esquerda
    right: '50%', // Reserve mais espaço à direita para os labels
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'value',
    inverse: true, // Inverter o eixo X para as barras crescerem da direita para a esquerda
    axisLabel: { show: false }, // Ocultar os labels do eixo X
    axisLine: { show: false }, // Ocultar a linha do eixo X
    axisTick: { show: false }, // Ocultar os ticks do eixo X
    splitLine: { show: false }, // Ocultar as linhas divisórias do eixo X
  },
  yAxis: {
    type: 'category',
    data: etapas.value,
    axisTick: {
      show: false,
    },
    axisLine: {
      show: false,
    },
    axisLabel: {
      show: false,
    },
  },
  series: [
    {
      type: 'bar',
      data: quantidades.value,
      barWidth: 35,
      colorBy: 'data',
      label: {
        show: true,
        position: 'right',
        formatter: (params) => {
          const label = etapas.value[params.dataIndex].toUpperCase(); // Usar o label das etapas
          const { value } = params;

          return `{number|${value}}\n{text|${label}}`;
        },
        rich: {
          number: {
            fontSize: 30,
            fontWeight: 'bold',
            color: (params) => params.color,
            align: 'left',
            padding: [0, 0, 0, 40],
            fontFamily: 'Roboto Slab',
          },
          text: {
            fontSize: 13,
            color: '#7e858d',
            align: 'left',
            padding: [0, 0, 0, 40],
            fontFamily: 'Roboto',
            fontWeight: '600',
          },
        },
      },
      itemStyle: {
        borderRadius: [999, 0, 0, 999],
      },
      markLine: {
        silent: true,
        label: {
          show: false,
        },
        symbol: 'none',
        lineStyle: {
          color: '#aaa',
          width: 1,
          type: 'solid',
        },
        data: [
          {
            xAxis: 0,
          },
        ],
      },
    },
  ],
}));
</script>
