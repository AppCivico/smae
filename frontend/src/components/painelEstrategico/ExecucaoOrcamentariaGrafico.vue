<template>
  <div
    role="region"
    aria-label="Gráfico de execução orçamentária"
    tabindex="0"
  >
    <label class="mb1">
      <input
        v-model="numeroCompactado"
        type="checkbox"
        class="inputcheckbox interruptor"
        aria-label="Exibir valores em formato compactado"
      >
      valores compactados
    </label>

    <div
      class="min-width"
      style="--min-width: 55rem;"
    >
      <GraficoDashboard
        :key="String(numeroCompactado)"
        :option="chartOption"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import GraficoDashboard from '@/components/graficos/GraficoDashboard.vue';
import dinheiro from '@/helpers/dinheiro';
import type {
  PainelEstrategicoExecucaoOrcamentariaAno,
} from '@back/gestao-projetos/painel-estrategico/entities/painel-estrategico-responses.dto';
import type { DefaultLabelFormatterCallbackParams } from 'echarts';
import { computed, ref } from 'vue';

const props = defineProps({
  execucaoOrcamentaria: {
    type: Array as () => PainelEstrategicoExecucaoOrcamentariaAno[],
    required: true,
  },
});

const numeroCompactado = ref<boolean>(true);

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
      formatter: (value: number) => `R$ ${dinheiro(value, { compactado: numeroCompactado.value, minimumFractionDigits: 0 })}`,
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
        formatter: (params: DefaultLabelFormatterCallbackParams) => (params.value
          ? `R$ ${dinheiro(Number(params.value), {
            semDecimais: numeroCompactado.value,
            compactado: numeroCompactado.value,
            maximumFractionDigits: 3,
          })}`
          : ''),
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
        formatter: (params: DefaultLabelFormatterCallbackParams) => (params.value
          ? `R$ ${dinheiro(Number(params.value), {
            semDecimais: numeroCompactado.value,
            compactado: numeroCompactado.value,
            maximumFractionDigits: 3,
          })}`
          : ''),
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
        formatter: (params: DefaultLabelFormatterCallbackParams) => (params.value
          ? `R$ ${dinheiro(Number(params.value), {
            semDecimais: numeroCompactado.value,
            compactado: numeroCompactado.value,
            maximumFractionDigits: 3,
          })}`
          : ''),
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'Roboto',
        color: '#d96f3b',
      },
    },
  ],
}));
</script>
