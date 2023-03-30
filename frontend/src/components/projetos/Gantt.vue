<template>
  <div class="flex center mb2 spacebetween">
    <div class="f1 mr1">
      <label class="label tc300">Exibir por</label>
      <select
        v-model="ganttType"
        class="inputtext"
      >
        <option
          value=""
          :selected="!!status"
        >
          qualquer
        </option>
        <option
          v-for="item in tiposDeGráfico"
          :key="item.value"
          :value="item.value"
        >
          {{ item.name }}
        </option>
      </select>
    </div>
    <hr class="ml2 f1">
  </div>

  <div
    id="gantt"
    ref="svgElementContainer"
  />
</template>
<script setup>
import renderChart from '@/helpers/ganttChart';
import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch
} from 'vue';

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

const tiposDeGráfico = [
  {
    name: 'panorama',
    value: 'overall',
  },
  {
    name: 'sprint',
    value: 'sprint',
  },
  {
    name: 'Ano',
    value: 'yearly',
  },
  {
    name: 'Mês',
    value: 'monthly',
  },
  {
    name: 'Trimestre',
    value: 'quarterly',
  },
];

const ganttType = ref(null);
const svgElementContainer = ref(null);
const dadosParaGantt = computed(() => props.data
  .map((x) => ({
    ...x,
    end_date: x.termino_real || x.termino_planejado,
    start_date: x.inicio_real || x.inicio_planejado,
    dependsOn: x.dependencias?.map((y) => y.dependencia_tarefa_id) || [],
    title: x.tarefa,
    completion_percentage: x.percentual_concluido,
  }))
  // eslint-disable-next-line max-len
  .filter((x) => x.start_date && x.end_date));

const config = computed(() => ({
  data: dadosParaGantt.value,
  element: svgElementContainer.value, // The element for rendering the chart
  box_padding: 10, // Padding for the blocks
  // metrics: {type: "overall", years: [2016, 2017, 2018]}, // Type of gantt
  // metrics: { type: 'sprint', year: 2017, cycles }, // Type of gantt
  metrics: { type: 'yearly', year: 2023 }, // Type of gantt
  // metrics: {type: "monthly", month: 'March 2017'}, // For Monthly Data
  // metrics: {type: "quarterly", months: ['January 2017','February 2017','March 2017', 'April 2017', 'May 2017', 'June 2017']}, // For quarterly or half yearly data
  onClick: function onClick(data) {
    console.log(data); // Onclick of each node
  },
  onEmptyButtonClick: function onEmptyButtonClick() {
    console.log('Empty Clicked');
  },
  onAreaClick: function onAreaClick(location) {
    console.log(`Clicked On${location}`);
  },
}));

watch(() => props.data, async () => {
  await nextTick();
  renderChart(config.value);
});

onMounted(async () => {
  if (props.data.length) {
    await nextTick();
    renderChart(config.value);
  }
});
</script>
<style lang="less">
[id='gantt'] {
  .chart {
    overflow-x: hidden;
  }

  .cp {
    cursor: pointer;
  }

  .Single--Node {
    fill: #fff;
    stroke: #ccc;
    stroke-width: 1;
    border-radius: 10px;
  }

  .Title {
    font-weight: 600;
    font-size: 15px;
  }

  .TermType,
  .Duration {
    fill: #989898;
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .second-title {
    font-size: 13px;
    text-transform: capitalize;
  }

  .date-line {
    stroke: #f5f5f5;
    stroke-width: 1;
  }

  .Date-Block,
  .Date-Block-Outline {
    fill: #fff;
    stroke: #ccc;
  }

  .start-lines,
  .end-lines {
    stroke-width: 1;
  }

  .gantt-wrapper {
    display: flex;
    flex-direction: column;
    border: 1px solid #767676;
    border-radius: 5px 5px 0px 0px;
    height: 100vh;
  }

  .chart {
    overflow: auto;
  }

  .gantt-top {
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 150px;
  }

  .range-select p {
    margin-left: 20px;
  }

  .gantt-top p,
  .gantt-top select,
  .gantt-top .range-select,
  .gantt-top button {
    display: inline-block;
  }

  .empty_message_block {
    border: #ccc;
    border-radius: 4px;
  }

  .CurrentDay-Area {
    stroke: #60bdf1;
  }
}
</style>
