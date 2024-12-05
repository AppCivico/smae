<template>
  <div>
    <div class="flex justifycenter">
      <NumeroComLegenda
        v-if="posicaoAtual"
        como-item
        :numero="posicaoAtual"
        cor="#221F43"
        legenda="Posição atual"
        cor-de-fundo="#e8e8e866"
        :tamanho-do-numero="34"
        :tamanho-da-legenda="12"
      />
    </div>
    <GraficoDashboard :option="configuracaoGrafico" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Big from 'big.js';
import GraficoDashboard from '@/components/graficos/GraficoDashboard.vue';
import NumeroComLegenda
  from '@/components/painelEstrategico/NumeroComLegenda.vue';

import { dateToMonthYear } from '@/helpers/dateToDate';

const props = defineProps({
  valores: {
    type: Object,
    default: () => ({
      linhas: [],
      ordem_series: [],
    }),
  },
});

const posicaoAtual = computed(() => {
  const ordemSeries = props.valores?.ordem_series || [];
  const idxRealizadoAcumulado = ordemSeries.indexOf('RealizadoAcumulado');
  const data = props.valores?.linhas || [];
  const serieRealizadoAcumulado = data.map((linha) => (
    linha.series[idxRealizadoAcumulado]?.valor_nominal
      ? new Big(linha.series[idxRealizadoAcumulado].valor_nominal).toNumber()
      : 0));
  return serieRealizadoAcumulado[serieRealizadoAcumulado.length - 1];
});

const configuracaoGrafico = computed(() => {
  if (!props.valores?.linhas?.length || !props.valores?.ordem_series?.length) {
    return {};
  }

  const ordemSeries = props.valores.ordem_series;
  const data = props.valores.linhas;

  const idxPrevisto = ordemSeries.indexOf('Previsto');
  const idxPrevistoAcumulado = ordemSeries.indexOf('PrevistoAcumulado');
  const idxRealizado = ordemSeries.indexOf('Realizado');

  const extrairValor = (linha, idx) => (
    linha.series[idx]?.valor_nominal
      ? new Big(linha.series[idx].valor_nominal)
      : new Big(0)
  );

  const seriePrevisto = data
    .map((linha) => extrairValor(linha, idxPrevisto).toNumber());

  const serieRealizado = data
    .map((linha) => extrairValor(linha, idxRealizado).toNumber());

  const seriePrevistoAcumulado = [];
  data.reduce((acumulado, linha) => {
    const valorAtual = extrairValor(linha, idxPrevisto).toNumber();
    const novoAcumulado = acumulado.plus(valorAtual);
    seriePrevistoAcumulado.push(novoAcumulado.toNumber());
    return novoAcumulado;
  }, new Big(0));

  const serieRealizadoAcumulado = [];
  data.reduce((acumulado, linha) => {
    const valorAtual = extrairValor(linha, idxRealizado).toNumber();
    const novoAcumulado = acumulado.plus(valorAtual);
    serieRealizadoAcumulado.push(novoAcumulado.toNumber());
    return novoAcumulado;
  }, new Big(0));

  const categorias = data.map((linha) => dateToMonthYear(linha.periodo));

  const anos = [];
  categorias.forEach((categoria, index) => {
    const anoAtual = categoria.split('/')[1];
    const anoAnterior = index > 0 ? categorias[index - 1].split('/')[1] : null;
    if (anoAtual !== anoAnterior) {
      anos.push({ index, ano: anoAtual });
    }
  });

  const linhasAnos = anos.map(({ index }) => ({
    xAxis: categorias[index],
    lineStyle: {
      type: 'dashed',
      color: '#999',
      symbol: 'none',
    },
    label: {
      show: false,
    },
  }));

  const meta = extrairValor(data[data.length - 1], idxPrevistoAcumulado)
    .toNumber();

  const serieMeta = new Array(categorias.length).fill(meta);

  return {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: [
        'Previsto',
        'Previsto Acumulado',
        'Realizado',
        'Realizado Acumulado',
        'Meta',
      ],
      top: '5%',
    },
    xAxis: {
      type: 'category',
      data: categorias,
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: 'Previsto',
        type: 'line',
        data: seriePrevisto,
        symbolSize: 10,
        smooth: true,
        itemStyle: {
          color: '#8EAFC8',
        },
        lineStyle: {
          color: '#8EAFC8',
        },
        label: {
          show: false,
        },
      },
      {
        name: 'Previsto Acumulado',
        type: 'line',
        data: seriePrevistoAcumulado,
        symbolSize: 10,
        smooth: true,
        itemStyle: {
          color: '#B5E48C',
        },
        lineStyle: {
          color: '#B5E48C',
        },
        label: {
          show: false,
        },
      },
      {
        name: 'Realizado',
        type: 'line',
        data: serieRealizado,
        symbolSize: 10,
        smooth: true,
        itemStyle: {
          color: '#437AA3',
        },
        lineStyle: {
          color: '#437AA3',
        },
        label: {
          show: false,
        },
      },
      {
        name: 'Realizado Acumulado',
        type: 'line',
        data: serieRealizadoAcumulado,
        symbolSize: 10,
        smooth: true,
        itemStyle: {
          color: '#4F8562',
        },
        lineStyle: {
          color: '#4F8562',
        },
        label: {
          show: false,
        },
        markLine: {
          data: linhasAnos,
          symbol: 'none',
        },
      },
      {
        name: 'Meta',
        type: 'line',
        data: serieMeta,
        showSymbol: false,
        smooth: true,
        itemStyle: {
          color: '#F2890D',
        },
        lineStyle: {
          type: 'dashed',
          color: '#F2890D',
        },
      },
    ],
  };
});
</script>
