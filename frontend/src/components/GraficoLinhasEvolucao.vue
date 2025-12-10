<template>
  <div v-if="valores?.linhas?.length">
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
import Big from 'big.js';
import { computed } from 'vue';

import GraficoDashboard from '@/components/graficos/GraficoDashboard.vue';
import NumeroComLegenda from '@/components/painelEstrategico/NumeroComLegenda.vue';
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

const colorPalette = {
  previsto: '#8eafc8',
  previstoAcumulado: '#b5e48c',
  realizado: '#437aa3',
  realizadoAcumulado: '#4f8562',
  meta: '#F2890D',
};

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

  const encontrarPrimeiroIndicePrevia = (indice) => {
    if (indice === -1) return -1;
    return data.findIndex((linha) => linha.series[indice]?.eh_previa === true);
  };

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
    indiceRealizadoPrevia: encontrarPrimeiroIndicePrevia(idxRealizado),
    indiceRealizadoAcumuladoPrevia: encontrarPrimeiroIndicePrevia(idxRealizadoAcumulado),
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
    indiceRealizadoPrevia,
    indiceRealizadoAcumuladoPrevia,
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

  const criarSeriePrevia = (nome, serie, cor, indicePrevia) => {
    if (indicePrevia === -1) return null;

    return {
      name: `${nome} (prévia)`,
      type: 'line',
      data: serie.map((v, i) => (i >= indicePrevia - 1 ? v : null)),
      symbolSize: 10,
      smooth: true,
      connectNulls: true,
      itemStyle: {
        color: cor,
        borderType: 'dashed',
      },

      lineStyle: {
        type: 'dashed',
        color: cor,
      },
      label: { show: false },
    };
  };

  const formatarTooltip = (params) => {
    if (!params || params.length === 0) return '';

    const criarLinhaTooltip = (nome, valor, cor) => `
      <div style="margin-bottom: 4px;">
        <span style="display:inline-block;width:10px;height:10px;background-color:${cor};margin-right:5px;border-radius: 50%;"></span>
        <strong>${nome}:</strong> ${formatarNumero(valor)}
      </div>
    `;

    // Adicionar período/data do eixo X
    const periodo = params[0]?.name || params[0]?.axisValue;
    let html = '<div style="padding: 8px;">';
    if (periodo) {
      html += `<div style="margin-bottom: 8px; font-weight: bold;">${periodo}</div>`;
    }

    // Primeiro passo: identificar se temos dados de séries com prévia
    const seriesConsolidadas = new Map();

    params.forEach((param) => {
      const { seriesName, value, dataIndex } = param;

      let valorExtraido;
      if (Array.isArray(value)) {
        valorExtraido = value[1] !== undefined ? value[1] : value[0];
      } else {
        valorExtraido = value;
      }

      const ehPrevia = seriesName.includes('(prévia)');
      const nomeBase = ehPrevia ? seriesName.replace(' (prévia)', '') : seriesName;

      // Consolidar apenas "Realizado" e "Realizado Acumulado"
      if (nomeBase === 'Realizado' || nomeBase === 'Realizado Acumulado') {
        // Verificar se o ponto atual é realmente prévia baseado no dataIndex
        let ehRealmentePrevia = false;
        if (nomeBase === 'Realizado' && indiceRealizadoPrevia !== -1) {
          ehRealmentePrevia = dataIndex >= indiceRealizadoPrevia;
        }
        if (nomeBase === 'Realizado Acumulado' && indiceRealizadoAcumuladoPrevia !== -1) {
          ehRealmentePrevia = dataIndex >= indiceRealizadoAcumuladoPrevia;
        }

        // Escolher valor correto (valores reais têm precedência sobre prévias)
        const dadosExistentes = seriesConsolidadas.get(nomeBase);
        // Adicionar quando: não existe OU (novo é real E existente é prévia)
        // OU (novo é prévia E tem valor válido)
        const deveAdicionar = !dadosExistentes
          || (!ehRealmentePrevia && dadosExistentes.ehPrevia)
          || (ehRealmentePrevia && valorExtraido !== null && valorExtraido !== undefined);

        if (deveAdicionar) {
          seriesConsolidadas.set(nomeBase, {
            valor: valorExtraido,
            color: param.color,
            ehPrevia: ehRealmentePrevia,
          });
        }
      }
    });

    // Segundo passo: renderizar séries consolidadas e não consolidadas
    const seriesJaRenderizadas = new Set();

    params.forEach((param) => {
      const { seriesName, value, color } = param;

      let valorExtraido;
      if (Array.isArray(value)) {
        valorExtraido = value[1] !== undefined ? value[1] : value[0];
      } else {
        valorExtraido = value;
      }

      const ehPrevia = seriesName.includes('(prévia)');
      const nomeBase = ehPrevia ? seriesName.replace(' (prévia)', '') : seriesName;

      // Para séries consolidadas (Realizado e Realizado Acumulado)
      if (nomeBase === 'Realizado' || nomeBase === 'Realizado Acumulado') {
        // Renderizar apenas uma vez por nomeBase
        if (seriesJaRenderizadas.has(nomeBase)) {
          return;
        }

        const dadosConsolidados = seriesConsolidadas.get(nomeBase);
        if (dadosConsolidados) {
          const nomeExibir = dadosConsolidados.ehPrevia ? `${nomeBase} (prévia)` : nomeBase;
          html += criarLinhaTooltip(nomeExibir, dadosConsolidados.valor, dadosConsolidados.color);
          seriesJaRenderizadas.add(nomeBase);
        }
      } else {
        // Outras séries: comportamento original
        html += criarLinhaTooltip(seriesName, valorExtraido, color);
      }
    });

    html += '</div>';
    return html;
  };

  return {
    tooltip: {
      trigger: 'axis',
      formatter: formatarTooltip,
    },
    legend: {
      data: [
        'Previsto',
        'Previsto Acumulado',
        'Realizado',
        ...(indiceRealizadoPrevia !== -1
          ? [{
            name: 'Realizado (prévia)',
            itemStyle: {
              borderType: 'dashed',
            },
          }]
          : []),
        'Realizado Acumulado',
        ...(indiceRealizadoAcumuladoPrevia !== -1
          ? [{
            name: 'Realizado Acumulado (prévia)',
            itemStyle: {
              borderType: 'dashed',
            },
          }]
          : []),
        ...(serieMeta ? ['Meta'] : []),
      ],
    },
    toolbox: {
      show: false,
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
    ],
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
          color: colorPalette.previsto,
        },
        lineStyle: {
          color: colorPalette.previsto,
        },
        label: {
          show: false,
        },
        markPoint: criarMarkPoint(seriePrevisto, colorPalette.previsto),
      },
      {
        name: 'Previsto Acumulado',
        type: 'line',
        data: seriePrevistoAcumulado,
        symbolSize: 10,
        smooth: true,
        itemStyle: {
          color: colorPalette.previstoAcumulado,
        },
        lineStyle: {
          color: colorPalette.previstoAcumulado,
        },
        label: {
          show: false,
        },
        markPoint: criarMarkPoint(seriePrevistoAcumulado, colorPalette.previstoAcumulado),
      },
      {
        name: 'Realizado',
        type: 'line',
        data: indiceRealizadoPrevia !== -1
          ? serieRealizado.map((v, i) => (i < indiceRealizadoPrevia ? v : null))
          : serieRealizado,
        symbolSize: 10,
        smooth: true,
        itemStyle: {
          color: colorPalette.realizado,
        },
        lineStyle: {
          color: colorPalette.realizado,
        },
        label: {
          show: false,
        },
        markPoint: criarMarkPoint(serieRealizado, colorPalette.realizado),
      },
      ...[criarSeriePrevia('Realizado', serieRealizado, colorPalette.realizado, indiceRealizadoPrevia)].filter(Boolean),
      {
        name: 'Realizado Acumulado',
        type: 'line',
        data: indiceRealizadoAcumuladoPrevia !== -1
          ? serieRealizadoAcumulado.map((v, i) => (i < indiceRealizadoAcumuladoPrevia ? v : null))
          : serieRealizadoAcumulado,
        symbolSize: 10,
        smooth: true,
        itemStyle: {
          color: colorPalette.realizadoAcumulado,
        },
        lineStyle: {
          color: colorPalette.realizadoAcumulado,
        },
        label: {
          show: false,
        },
        markLine: {
          data: linhasAnos,
          symbol: 'none',
        },
        markPoint: criarMarkPoint(serieRealizadoAcumulado, colorPalette.realizadoAcumulado),
      },
      ...[criarSeriePrevia(
        'Realizado Acumulado',
        serieRealizadoAcumulado,
        colorPalette.realizadoAcumulado,
        indiceRealizadoAcumuladoPrevia,
      )].filter(Boolean),
      ...(serieMeta
        ? [
          {
            name: 'Meta',
            type: 'line',
            data: serieMeta,
            showSymbol: false,
            smooth: true,
            itemStyle: {
              color: colorPalette.meta,
            },
            lineStyle: {
              type: 'dashed',
              color: colorPalette.meta,
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
