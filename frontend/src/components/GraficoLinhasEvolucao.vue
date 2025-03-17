<template>
  <div>
    <div class="flex justifycenter">
      <NumeroComLegenda
        v-if="posicaoAtual"
        como-item
        cor="#221F43"
        :legenda="`Posição atual ${temMeta ? ' / Meta' : ''}`"
        cor-de-fundo="#e8e8e866"
        :tamanho-do-numero="34"
        :tamanho-da-legenda="12"
      >
        <template #numero>
          {{ formatarNumero(posicaoAtual) }}<span v-if="temMeta">/</span>
          <small v-if="temMeta">
            {{ formatarNumero($props.indicador.meta_valor_nominal) }}
          </small>
        </template>
      </NumeroComLegenda>
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
  indicador: {
    type: Object,
    default: () => ({}),
  },
});

const temMeta = computed(() => props.indicador.meta_valor_nominal);

const formatarNumero = (numero) => {
  if (numero === null || numero === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(numero);
};

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

  const meta = props.indicador?.meta_valor_nominal
    ? Number(props.indicador.meta_valor_nominal)
    : null;

  const categorias = data.map((linha) => dateToMonthYear(linha.periodo));

  const serieRealizado = mapearSerie(idxRealizado);

  const ultimoMesPreenchidoIndex = serieRealizado.findLastIndex((serie) => serie !== null);

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
    serieRealizado,
    serieRealizadoAcumulado: mapearSerie(idxRealizadoAcumulado),
    serieMeta: meta !== null ? categorias.map(() => meta) : null,
    anos,
    ultimoMesPreenchidoIndex,
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
    ultimoMesPreenchidoIndex,
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

  const criarMarkPoint = (serie, cor) => ({
    data: [
      {
        name: 'Último Mês Preenchido',
        coord: [categorias[ultimoMesPreenchidoIndex], serie[ultimoMesPreenchidoIndex]],
        symbol: 'circle',
        symbolSize: 12,
        itemStyle: {
          color: cor,
          borderColor: cor,
          borderWidth: 2,
        },
      },
    ],
  });

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
        ...(serieMeta ? ['Meta'] : []),
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
        markPoint: criarMarkPoint(seriePrevisto, '#8EAFC8'),
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
        markPoint: criarMarkPoint(seriePrevistoAcumulado, '#B5E48C'),
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
        markPoint: criarMarkPoint(serieRealizado, '#437AA3'),
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
        markLine: {
          data: linhasAnos,
          symbol: 'none',
        },
        markPoint: criarMarkPoint(serieRealizadoAcumulado, '#4F8562'),
      },
      ...(serieMeta
        ? [
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
        ]
        : []),
    ],
  };
});
</script>

<style scoped>
  small {
    font-size: 70%;
    opacity: 0.65;
  }
</style>
