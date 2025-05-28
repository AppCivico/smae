<template>
  <div
    role="region"
    aria-label="Gráfico de execução orçamentária"
    tabindex="0"
  >
    <div
      class="min-width"
      style="--min-width: 55rem;"
    >
      <GraficoDashboard :option="chartOption" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import GraficoDashboard from '@/components/graficos/GraficoDashboard.vue';
import dinheiro from '@/helpers/dinheiro';

const props = defineProps({
  execucaoOrcamentaria: {
    type: Array,
    required: true,
  },
});

const chartOption = computed(() => ({
  grid: {
    top: '35%',
    left: '3%',
    right: '3%',
    containLabel: true,
  },
  legend: {
    orient: 'vertical',
    right: '3%',
    itemGap: 20,
  },
  xAxis: {
    type: 'category',
    data: props.execucaoOrcamentaria.map((item) => item.ano_referencia),
    axisLabel: {
      fontSize: 14,
      fontFamily: 'Roboto',
      fontWeight: 600,
      color: '#142133',
    },
  },
  yAxis: {
    axisLabel: {
      fontSize: 14,
      fontFamily: 'Roboto',
      fontWeight: 600,
      color: '#142133',
      formatter: (value) => `R$ ${dinheiro(value, { semDecimais: true })}`,
    },
    splitLine: {
      lineStyle: {
        color: '#E0E0E0',
      },
    },
  },
  series: [
    {
      name: 'Custo Planejado Total',
      type: 'line',
      data: props.execucaoOrcamentaria.map((item) => item.custo_planejado_total),
      smooth: true,
      itemStyle: {
        color: '#1c2e46',
      },
      label: {
        show: true,
        rotate: 90,
        align: 'verticalCenter',
        position: 'center',
        offset: [5, 0],
        formatter: (params) => (params.value ? `R$ ${dinheiro(params.value, { semDecimais: true })}` : ''),
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'Roboto',
        color: '#1c2e46',
      },
      symbolSize: 10,
    },
    {
      name: 'Valor Empenhado Total',
      type: 'bar',
      data: props.execucaoOrcamentaria.map((item) => item.valor_empenhado_total),
      barWidth: 30,
      itemStyle: {
        color: '#e4b078',
        borderRadius: [999, 999, 0, 0],
      },
      label: {
        show: true,
        align: 'verticalCenter',
        position: 'center',
        offset: [5, 10],
        rotate: 90,
        formatter: (params) => (params.value ? `R$ ${dinheiro(params.value, { semDecimais: true })}` : ''),
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'Roboto',
        color: '#e4b078',
      },
    },
    {
      name: 'Valor Liquidado Total',
      type: 'bar',
      data: props.execucaoOrcamentaria.map((item) => item.valor_liquidado_total),
      barWidth: 30,
      itemStyle: {
        color: '#d96f3b',
        borderRadius: [999, 999, 0, 0],
      },
      label: {
        show: true,
        rotate: 90,
        align: 'verticalCenter',
        position: 'center',
        offset: [5, 10],
        formatter: (params) => (params.value ? `R$ ${dinheiro(params.value, { semDecimais: true })}` : ''),
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'Roboto',
        color: '#d96f3b',
      },
    },
  ],
}));
</script>
