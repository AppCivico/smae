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

const extrairValor = (linha, idx) => {
  try {
    const valor = linha.series[idx]?.valor_nominal;
    return new Big(valor);
  } catch {
    return null;
  }
};

const indicesSeries = computed(() => {
  const ordemSeries = props.valores?.ordem_series || [];
  return {
    idxPrevisto: ordemSeries.indexOf('Previsto'),
    idxPrevistoAcumulado: ordemSeries.indexOf('PrevistoAcumulado'),
    idxRealizado: ordemSeries.indexOf('Realizado'),
    idxRealizadoAcumulado: ordemSeries.indexOf('RealizadoAcumulado'),
  };
});

const dadosProcessados = computed(() => {
  const {
    idxPrevisto, idxPrevistoAcumulado, idxRealizado, idxRealizadoAcumulado,
  } = indicesSeries.value;
  const data = props.valores?.linhas || [];

  const mapearSerie = (indice) => data.map((linha) => {
    const valor = extrairValor(linha, indice);
    return valor !== null ? valor.toNumber() : null;
  });

  const meta = data.length > 0
    ? mapearSerie(idxPrevistoAcumulado).at(-1)
    : null;

  const categorias = data.map((linha) => dateToMonthYear(linha.periodo));

  const calcularAnos = (listaCategorias) => {
    const anos = [];
    listaCategorias.forEach((categoria, index) => {
      const anoAtual = categoria.split('/')[1];
      const anoAnterior = index > 0 ? listaCategorias[index - 1].split('/')[1] : null;
      if (anoAtual !== anoAnterior) {
        anos.push({ index, ano: anoAtual });
      }
    });
    return anos;
  };

  const anos = calcularAnos(categorias);

  return {
    categorias,
    seriePrevisto: mapearSerie(idxPrevisto),
    seriePrevistoAcumulado: mapearSerie(idxPrevistoAcumulado),
    serieRealizado: mapearSerie(idxRealizado),
    serieRealizadoAcumulado: mapearSerie(idxRealizadoAcumulado),
    serieMeta: categorias.map(() => meta),
    anos,
  };
});

const posicaoAtual = computed(() => {
  const { serieRealizadoAcumulado } = dadosProcessados.value;
  return serieRealizadoAcumulado[serieRealizadoAcumulado.length - 1];
});

const configuracaoGrafico = computed(() => {
  const {
    categorias,
    seriePrevisto,
    seriePrevistoAcumulado,
    serieRealizado,
    serieRealizadoAcumulado,
    serieMeta,
    anos,
  } = dadosProcessados.value;

  if (!props.valores?.linhas?.length || !props.valores?.ordem_series?.length) {
    return {};
  }

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
          color: '#8eafc8',
        },
        lineStyle: {
          color: '#8eafc8',
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
          color: '#b5e48c',
        },
        lineStyle: {
          color: '#b5e48c',
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
          color: '#437aa3',
        },
        lineStyle: {
          color: '#437aa3',
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
          color: '#4f8562',
        },
        lineStyle: {
          color: '#4f8562',
        },
        label: {
          show: false,
        },
        markPoint: {
          data: [
            {
              name: 'Posição Atual',
              coord: [categorias[categorias.length - 1], posicaoAtual.value],
              symbol: 'circle',
              symbolSize: 15,
              itemStyle: {
                color: '#4f8562',
                borderColor: '#4f8562',
                borderWidth: 2,
              },
              label: {
                show: true,
                formatter: () => `Posição atual \n ${posicaoAtual.value}`,
                position: 'top',
                fontSize: 12,
                color: '#4f8562',
                fontWeight: 'bold',
              },
            },
          ],
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
