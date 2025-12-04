<template>
  <div
    role="region"
    aria-label="Gráfico de execução orçamentária"
    tabindex="0"
  >
    <div
      v-if="anosDisponiveis.length > 1"
      class="flex flexwrap g1"
    >
      <div>
        <label
          class="label tc300"
          for="grafico-ano-inicial"
        >
          Ano Inicial
        </label>
        <select
          id="grafico-ano-inicial"
          v-model="anoInicial"
          class="inputtext"
          @change="validarAnoInicial"
        >
          <option
            v-for="ano in anosDisponiveis"
            :key="ano"
            :value="ano"
          >
            {{ ano }}
          </option>
        </select>
      </div>
      <div>
        <label
          class="label tc300"
          for="grafico-ano-final"
        >
          Ano Final
        </label>
        <select
          id="grafico-ano-final"
          v-model="anoFinal"
          class="inputtext"
          @change="validarAnoFinal"
        >
          <option
            v-for="ano in anosFinaisValidos"
            :key="ano"
            :value="ano"
          >
            {{ ano }}
          </option>
        </select>
      </div>
    </div>
    <div
      v-if="dadosHeatmap.length > 0"
      class="min-width"
      style="--min-width: 55rem;"
    >
      <GraficoDashboard
        :option="configuracaoGrafico"
        :tooltip-template="formatarTooltip"
      />
    </div>
    <div v-else>
      <p>Sem dados disponíveis para exibir no gráfico.</p>
    </div>
  </div>
</template>

<script setup>
import { sortBy } from 'lodash';
import {
  ref,
  computed,
  onMounted,
  watch,
} from 'vue';

import GraficoDashboard from '@/components/graficos/GraficoDashboard.vue';
import { dateToMonthYear } from '@/helpers/dateToDate';

const props = defineProps({
  valores: {
    type: Object,
    required: true,
  },
});

const categorias = computed(() => props.valores.dados_auxiliares?.categoricas || {});
const indiceRealizado = computed(() => props.valores.ordem_series.indexOf('Realizado'));
const anoInicial = ref(null);
const anoFinal = ref(null);
const dadosHeatmap = ref([]);
const dadosPrevia = ref([]);
const configuracaoGrafico = ref({});

if (indiceRealizado.value === -1) {
  console.error('Série "Realizado" não encontrada na ordem das séries.');
}

const datasEixoX = computed(() => {
  const datas = [];

  // Adicionar datas das linhas normais
  props.valores.linhas.forEach(({ series }) => {
    const serieRealizado = series[indiceRealizado.value];
    if (serieRealizado && serieRealizado.elementos?.length) {
      const dataFormatada = dateToMonthYear(serieRealizado.data_valor);
      if (!datas.includes(dataFormatada)) {
        datas.push(dataFormatada);
      }
    }
  });

  // Adicionar data de prévia se existir
  if (props.valores.ultima_previa_indicador?.data_valor) {
    const dataPrevia = dateToMonthYear(props.valores.ultima_previa_indicador.data_valor);
    if (!datas.includes(dataPrevia)) {
      datas.push(dataPrevia);
    }
  }

  return datas;
});

const anosDisponiveis = computed(() => [...new Set(datasEixoX.value.map((data) => data.split('/')[1]))]);

const calcularIntervaloPadraoAnos = () => {
  const anos = anosDisponiveis.value;
  if (anos.length <= 4) {
    return [anos[0], anos[anos.length - 1]];
  }
  return [anos[0], anos[3]];
};

const anosFinaisValidos = computed(() => anosDisponiveis
  .value.filter((ano) => ano >= anoInicial.value));

const criarMapaCategorias = () => {
  // Obter e ordenar as chaves das categorias
  const chavesCategorias = Object.keys(categorias.value)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  // Criar o mapa de categorias para índices contínuos
  const mapaCategorias = {};
  chavesCategorias.forEach((chave, index) => {
    mapaCategorias[chave] = index;
  });

  return { mapaCategorias, chavesCategorias };
};

const calcularContagemCategorias = (serieRealizado, mapaCategorias, totalCategorias) => {
  const contagemCategorias = Array(totalCategorias).fill(0);

  serieRealizado.elementos.forEach(({ categoria }) => {
    const indiceCategoria = mapaCategorias[categoria];
    if (indiceCategoria !== undefined) {
      contagemCategorias[indiceCategoria] += 1;
    } else {
      console.warn(`Categoria "${categoria}" não encontrada no mapa de categorias.`);
    }
  });

  return contagemCategorias;
};

const adicionarDadosHeatmap = (dados, contagemCategorias, indiceX) => {
  contagemCategorias.forEach((contagem, indiceY) => {
    dados.push([indiceX, indiceY, contagem]);
  });
};

const preencherDadosHeatmap = () => {
  const dados = [];
  const previas = [];

  const { mapaCategorias, chavesCategorias } = criarMapaCategorias();

  props.valores.linhas.forEach(({ series }) => {
    const serieRealizado = series[indiceRealizado.value];
    if (!serieRealizado || !serieRealizado.elementos?.length) {
      return;
    }

    const contagemCategorias = calcularContagemCategorias(
      serieRealizado,
      mapaCategorias,
      chavesCategorias.length,
    );

    const dataFormatada = dateToMonthYear(serieRealizado.data_valor);
    const indiceX = datasEixoX.value.indexOf(dataFormatada);

    if (indiceX !== -1) {
      adicionarDadosHeatmap(dados, contagemCategorias, indiceX);
    }
  });

  // Processar ultima_previa_indicador se existir
  if (props.valores.ultima_previa_indicador?.elementos?.totais_categorica) {
    const previa = props.valores.ultima_previa_indicador;
    const dataFormatada = dateToMonthYear(previa.data_valor);
    const indiceX = datasEixoX.value.indexOf(dataFormatada);

    if (indiceX !== -1) {
      // Criar mapa de valores de totais_categorica para acesso rápido
      const valoresPorCategoria = {};
      previa.elementos.totais_categorica.forEach(({ categorica_valor, valor }) => {
        valoresPorCategoria[String(categorica_valor)] = Number(valor);
      });

      // Iterar TODAS as categorias conhecidas
      Object.keys(categorias.value).forEach((chaveCategoria) => {
        const indiceY = mapaCategorias[chaveCategoria];

        if (indiceY === undefined) {
          throw new Error(`Categoria ${chaveCategoria} não encontrada no mapa de categorias`);
        }

        const temDadoPrevia = chaveCategoria in valoresPorCategoria;
        const contagem = temDadoPrevia ? valoresPorCategoria[chaveCategoria] : 0;

        // Sempre adicionar célula (mesmo com valor 0)
        dados.push([indiceX, indiceY, contagem]);

        // Adicionar círculo amarelo se a categoria tem dado de prévia (mesmo que seja 0)
        if (temDadoPrevia) {
          previas.push([indiceX, indiceY]);
        }
      });
    }
  }

  dadosHeatmap.value = dados;
  dadosPrevia.value = previas;
};

const atualizarDadosGrafico = () => {
  if (!anoInicial.value || !anoFinal.value) return;

  const eixoXFiltrado = datasEixoX.value.filter((data) => {
    const ano = data.split('/')[1];
    return ano >= anoInicial.value && ano <= anoFinal.value;
  });

  let dadosFiltrados = dadosHeatmap.value.filter(([indiceX]) => {
    const ano = datasEixoX.value[indiceX].split('/')[1];
    return ano >= anoInicial.value && ano <= anoFinal.value;
  });

  dadosFiltrados = dadosFiltrados.map(([indiceX, indiceY, valor]) => {
    const novoIndiceX = eixoXFiltrado.indexOf(datasEixoX.value[indiceX]);
    return [novoIndiceX, indiceY, valor];
  });

  // Filtrar e remapear dados de prévia
  let previasFiltradas = dadosPrevia.value.filter(([indiceX]) => {
    const ano = datasEixoX.value[indiceX].split('/')[1];
    return ano >= anoInicial.value && ano <= anoFinal.value;
  });

  previasFiltradas = previasFiltradas.map(([indiceX, indiceY]) => {
    const novoIndiceX = eixoXFiltrado.indexOf(datasEixoX.value[indiceX]);
    return [novoIndiceX, indiceY];
  });

  configuracaoGrafico.value = {
    grid: {
      left: '10%',
    },
    visualMap: {
      min: 0,
      max: Math.max(...dadosFiltrados.map(([, , valor]) => valor)) || 1,
      orient: 'horizontal',
      left: 'center',
      bottom: '15%',
      show: false,
      seriesIndex: 0,
      inRange: {
        color: [
          '#d2dfe9',
          '#b4cada',
          '#8fb0c8',
          '#6995b6',
          '#447ba3',
          '#1e6091',
        ],
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: eixoXFiltrado,
      axisTick: {
        show: false,
      },
      axisLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'category',
      data: Object.values(categorias.value || { 1: 'Sem dados em elementos' }),
      boundaryGap: true,
      nameGap: 140,
      axisLabel: {
        formatter(valor) {
          const tamanhoMaximo = 20;
          if (valor.length > tamanhoMaximo) {
            return `${valor.slice(0, tamanhoMaximo)}...`;
          }
          return valor.split(' ').join('\n');
        },
        rotate: 45,
      },
      axisTick: {
        show: false,
      },
      axisLine: {
        show: false,
      },
    },
    series: [
      {
        type: 'heatmap',
        data: dadosFiltrados.length ? dadosFiltrados : [[0, 0, 0]],
        label: { show: false },
        itemStyle: {
          borderWidth: 3,
          borderColor: 'rgba(255, 255, 255, 1)',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
      ...(previasFiltradas.length > 0
        ? [
          {
            type: 'custom',
            coordinateSystem: 'cartesian2d',
            renderItem(params, api) {
              const x = api.value(0);
              const y = api.value(1);

              if (x === null || x === undefined || y === null || y === undefined) return null;

              const coord = api.coord([x, y]);
              if (!coord) return null;

              const nextXCoord = api.coord([x + 1, y]);
              const nextYCoord = api.coord([x, y + 1]);

              const cellWidth = nextXCoord ? Math.abs(nextXCoord[0] - coord[0]) : 50;
              const cellHeight = nextYCoord ? Math.abs(nextYCoord[1] - coord[1]) : 50;

              // Posicionar no canto superior esquerdo com margem
              const offsetX = -(cellWidth / 2) + 12;
              const offsetY = -(cellHeight / 2) + 12;

              return {
                type: 'circle',
                shape: {
                  cx: coord[0] + offsetX,
                  cy: coord[1] + offsetY,
                  r: 6,
                },
                style: {
                  fill: '#ffc107',
                },
                z2: 100,
              };
            },
            emphasis: {
              style: {
                strokeWidth: 2,
                stroke: '#ffc107',
              },
            },
            tooltip: {
              formatter: () => `
                <div class="projeto-tooltip" style="color: #333">
                  <p class="projeto-tooltip__valor">Esta série contém prévia de dados</p>
                </div>
              `,
            },
            data: previasFiltradas,
          },
        ]
        : []),
    ],
  };
};

const totalContagemPorMes = computed(() => {
  const totais = {};

  dadosHeatmap.value.forEach(([indiceX, , contagem]) => {
    const mesAno = datasEixoX.value[indiceX];
    if (!totais[mesAno]) {
      totais[mesAno] = 0;
    }
    totais[mesAno] += contagem;
  });
  return totais;
});

function formatarTooltip(param) {
  const [indiceX, indiceY, contagem] = param.data;
  const categoria = Object.values(categorias.value)[indiceY];

  // Verificar se este ponto é prévia
  const ehPrevia = dadosPrevia.value.some(
    ([cX, cY]) => cX === indiceX && cY === indiceY,
  );

  const mesAno = datasEixoX.value[indiceX];
  const totalMes = totalContagemPorMes.value[mesAno] || 1;
  const percentual = ((contagem / totalMes) * 100).toFixed(2);

  return `
    <div class="projeto-tooltip" style="color: #333">
      <p class="projeto-tooltip__valor">${categoria}${ehPrevia ? ' (Prévia)' : ''}</p>
      <p class="projeto-tooltip__valor">Contagem: ${contagem}</p>
      <p class="projeto-tooltip__valor">Percentual: ${percentual}%</p>
    </div>
  `;
}

const validarAnoInicial = () => {
  if (anoInicial.value > anoFinal.value) {
    anoFinal.value = anoInicial.value; // Ajusta o ano final
  }
};

const validarAnoFinal = () => {
  if (anoFinal.value < anoInicial.value) {
    anoInicial.value = anoFinal.value; // Ajusta o ano inicial
  }
};

onMounted(() => {
  const [anoInicialPadrao, anoFinalPadrao] = calcularIntervaloPadraoAnos();
  anoInicial.value = anoInicialPadrao;
  anoFinal.value = anoFinalPadrao;
  preencherDadosHeatmap();
  atualizarDadosGrafico();
});

watch([anoInicial, anoFinal], atualizarDadosGrafico);

</script>
