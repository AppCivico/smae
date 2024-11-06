<template>
  <div
    role="region"
    aria-label="Gráfico de execução orçamentária"
    tabindex="0"
  >
    <select
      v-model="selectedYear"
      @change="updateChartData"
    >
      <option
        v-for="year in years"
        :key="year"
        :value="year"
      >
        {{ year }}
      </option>
    </select>
    <div
      v-if="heatmapData.length > 0"
      class="min-width"
      style="--min-width: 55rem;"
    >
      <GraficoDashboard
        :option="chartOption"
        :tooltip-template="formatTooltip"
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

const props = defineProps({
  valores: {
    type: Object,
    required: true,
  },
});

const categorias = props.valores.dados_auxiliares?.categoricas || {};
const ordemSeries = props.valores.ordem_series;
const indexRealizado = ordemSeries.indexOf('Realizado');
const selectedYear = ref(null);
const heatmapData = ref([]);
const chartOption = ref({});

if (indexRealizado === -1) {
  console.error('Série "Realizado" não encontrada na ordem das séries.');
}

const xAxisDataWithCounts = computed(() => {
  const dates = [];
  props.valores.linhas.forEach(({ series }) => {
    const serieRealizado = series[indexRealizado];
    if (serieRealizado && serieRealizado.elementos?.length) {
      const formattedDate = dateToMonthYear(serieRealizado.data_valor);
      if (!dates.includes(formattedDate)) {
        dates.push(formattedDate);
      }
    }
  });
  return dates;
});

const years = computed(() => [...new Set(xAxisDataWithCounts.value.map((date) => date.split('/')[1]))]);

const populateHeatmapData = () => {
  const data = [];
  props.valores.linhas.forEach(({ series }) => {
    const serieRealizado = series[indexRealizado];
    if (serieRealizado && serieRealizado.elementos?.length) {
      const categoriaCounts = Array(Object.keys(categorias).length).fill(0);
      serieRealizado.elementos.forEach(({ categoria }) => {
        const categoriaIndex = parseInt(categoria, 10) - 1;
        if (categoriaIndex >= 0 && categoriaIndex < categoriaCounts.length) {
          categoriaCounts[categoriaIndex] += 1;
        }
      });
      const formattedDate = dateToMonthYear(serieRealizado.data_valor);
      const xIndex = xAxisDataWithCounts.value.indexOf(formattedDate);
      if (xIndex !== -1) {
        categoriaCounts.forEach((count, yIndex) => {
          data.push([xIndex, yIndex, count]);
        });
      }
    }
  });
  heatmapData.value = data;
};

const updateChartData = () => {
  const filteredXAxisData = xAxisDataWithCounts.value
    .filter((date) => date.endsWith(selectedYear.value));

  let filteredData = heatmapData.value
    .filter(([xIndex]) => xAxisDataWithCounts.value[xIndex].endsWith(selectedYear.value));

  // Ajusta o eixo X pra ele ainda ficar dentro do gráfico
  filteredData = filteredData.map(([xIndex, yIndex, value]) => {
    const newXIndex = filteredXAxisData.indexOf(xAxisDataWithCounts.value[xIndex]);
    return [newXIndex, yIndex, value];
  });

  chartOption.value = {
    visualMap: {
      min: 0,
      max: Math.max(...filteredData.map(([, , value]) => value)) || 1, // Não gostei, mas funciona
      orient: 'horizontal',
      left: 'center',
      bottom: '15%',
      show: false,
      inRange: {
        color: ['#b3d9ff', '#1a75ff'],
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: true,
      data: filteredXAxisData,
      axisTick: {
        show: false,
      },
      axisLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'category',
      data: Object.values(categorias || { 1: 'Sem dados em elementos' }),
      boundaryGap: true,
      axisTick: {
        show: false,
      },
      axisLine: {
        show: false,
      }
    },
    series: [
      {
        type: 'heatmap',
        data: filteredData.length ? filteredData : [[0, 0, 0]],
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

const totalCategoryCounts = computed(() => {
  const counts = {};

  heatmapData.value.forEach(([xIndex, yIndex, count]) => {
    if (!counts[yIndex]) counts[yIndex] = 0;
    counts[yIndex] += count;
  });

  return counts;
});

function formatTooltip(param) {
  const [xIndex, yIndex, count] = param.data;
  const totalForCategory = totalCategoryCounts.value[yIndex] || 1;
  const percentage = ((count / totalForCategory) * 100).toFixed(2);

  return `
    <div class="projeto-tooltip" style="color: #333">
      <p class="projeto-tooltip__valor">Contagem: ${count}</p>
      <p class="projeto-tooltip__valor">Percentual: ${percentage}%</p>
    </div>
  `;
}

onMounted(() => {
  const [firstYear] = years.value;
  selectedYear.value = firstYear;
  populateHeatmapData();
  updateChartData();
});

watch(selectedYear, updateChartData);

</script>
