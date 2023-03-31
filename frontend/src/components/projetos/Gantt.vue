<template>
  <!--div class="flex center mb2 spacebetween">
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
    <hr class="ml1 mr1 f1">
  </div-->

  <div class="flex mb2 spacebetween">
    <ul
      class="legenda f1 mb1 t13"
    >
      <li
        v-for="item in tiposDeDependências"
        :key="item.valor"
        class="legenda__item mb05"
        :class="`legenda__item--${item.valor}`"
      >
        <svg
          class="legenda__amostra"
          height="12"
          width="12"
        >
          <rect
            width="12"
            height="12"
            :fill="coresParaTiposDeDependências[item.valor]"
          />
        </svg>
        {{ item.nome }}
      </li>
    </ul>

    <ul
      class="legenda f1 mb1 t13"
    >
      <li class="legenda__item mb05">
        <svg
          class="legenda__amostra"
          width="20"
          height="12"
        >
          <path
            d="M0,6L20,6"
            fill="none"
            stroke="black"
            stroke-width="1"
            stroke-dasharray="3, 2"
          />
        </svg>
        início e final planejados
      </li>
      <li class="legenda__item mb05">
        <svg
          class="legenda__amostra"
          width="20"
          height="12"
        >
          <path
            d="M0,6L20,6"
            fill="none"
            stroke="black"
            stroke-width="1"
            stroke-dasharray="6, 3, 2, 3"
          />
        </svg>
        início real e final planejado
      </li>
      <li class="legenda__item mb05">
        <svg
          class="legenda__amostra"
          width="20"
          height="12"
        >
          <path
            d="M0,6L20,6"
            fill="none"
            stroke="black"
            stroke-width="1"
          />
        </svg>
        início e final reais
      </li>
    </ul>
  </div>
  <div
    id="gantt"
    ref="svgElementContainer"
  />
</template>
<script setup>
import dependencyTypes from '@/consts/dependencyTypes';
import renderChart from '@/helpers/ganttChart';
import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch
} from 'vue';
const tiposDeDependências = Object.keys(dependencyTypes)
  .map((x) => ({ valor: x, nome: dependencyTypes[x] }));

const coresParaTiposDeDependências = {
  inicia_pro_inicio: '#8EC122',
  inicia_pro_termino: '#4074BF',
  termina_pro_inicio: '#EE3B2B',
  termina_pro_termino: '#F2890D',
};

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
    dependsOn: x.dependencias || [],
    title: `${x.hierarquia} ${x.tarefa}`,
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
@import '@/_less/variables.less';

.legenda {
}

.legenda__item {
  display: block;
}

.legenda__amostra {
  display: inline-block;
  margin-right: 0.25em;
}

[id='gantt'] {
  .chart {
    overflow-x: hidden;
  }

  .cp {
    cursor: pointer;
  }

  .first-title {
    font-weight: bold;
    color: @primary;
  }

  .Single--Block {}

  .Single--Node {
    fill: #fff;
    stroke: hsl(216, 9.8%, 90%);
    stroke-width: 1;
    border-radius: 10px;
  }

  .Single--Node--estimated {
    stroke-dasharray: 3, 2;
  }

  .Single--Node--half-estimated {
    stroke-dasharray: 6, 3, 2, 3;
  }

  .Single--Block--focused {
    .Single--Node {
      stroke: black;
    }
  }

  [data-dependency-type='termina_pro_inicio'] {
    opacity: 1 !important;
    .Single--Node {
      stroke: @vermelho;
    }
  }

  [data-dependency-type='inicia_pro_inicio'] {
    opacity: 1 !important;
    .Single--Node {
      stroke: @verde;
    }
  }

  [data-dependency-type='inicia_pro_termino'] {
    opacity: 1 !important;
    .Single--Node {
      stroke: @azul;
    }
  }

  [data-dependency-type='termina_pro_termino']{
    opacity: 1 !important;
    .Single--Node {
      stroke: @laranja;
    }
  }

  .Title {
    font-weight: 600;
    font-size: 15px;
  }

  .TermType,
  .Duration {
    fill: #989898;
    font-size: 11px;
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

  .Date {
    fill: @c600;

    &[data-current='true'] {
      fill: @escuro;
    }
  }

  .Date-Block {

    &[data-current='true'] {
      fill: @c50;
    }
  }

  .ProgressBar-Fill {
    fill: @vermelho;
  }

  .start-lines,
  .end-lines {
    stroke-width: 1;
    stroke: hsl(216, 9.8%, 90%);
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
