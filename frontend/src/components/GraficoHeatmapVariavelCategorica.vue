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
import {
  ref,
  computed,
  onMounted,
  watch,
} from 'vue';
import GraficoDashboard from '@/components/graficos/GraficoDashboard.vue';
import { dateToMonthYear } from '@/helpers/dateToDate';
import { sortBy } from 'lodash';

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
const configuracaoGrafico = ref({});

if (indiceRealizado.value === -1) {
  console.error('Série "Realizado" não encontrada na ordem das séries.');
}

const datasEixoX = computed(() => {
  const datas = [];
  props.valores.linhas.forEach(({ series }) => {
    const serieRealizado = series[indiceRealizado.value];
    if (serieRealizado && serieRealizado.elementos?.length) {
      const dataFormatada = dateToMonthYear(serieRealizado.data_valor);
      if (!datas.includes(dataFormatada)) {
        datas.push(dataFormatada);
      }
    }
  });
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

  dadosHeatmap.value = dados;
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
  const mesAno = datasEixoX.value[indiceX];
  const totalMes = totalContagemPorMes.value[mesAno] || 1;
  const percentual = ((contagem / totalMes) * 100).toFixed(2);

  return `
    <div class="projeto-tooltip" style="color: #333">
      <p class="projeto-tooltip__valor">${categoria}</p>
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
