<template>
  <div class="flex flexwrap center mb2 spacebetween">
    <div
      class="f1 mr1 mb1"
      style="min-width: 7.5em;"
    >
      <label class="label tc300">Exibir por</label>
      <select
        v-model="tipoDeGantt"
        class="inputtext"
        @change="renderChart(config)"
      >
        <option
          v-for="item in tiposDeGráfico"
          :key="item.value"
          :value="item.value"
        >
          {{ item.name }}
        </option>
      </select>
    </div>
    <hr class="mr1 f1">
    <div
      class="f1 mr1 mb1"
      style="min-width: 10em;"
    >
      <label class="label tc300">Filtrar por</label>
      <select
        v-model="filtroAtivo"
        class="inputtext"
        @change="renderChart(config)"
      >
        <option
          v-for="item in opçõesDeFiltragem"
          :key="item.value"
          :value="item.value"
        >
          {{ item.name }}
        </option>
      </select>
    </div>
    <hr class="mr1 f1">
    <div class="f1 mr1 mb1">
      <label class="label tc300">Ano</label>
      <select
        v-model="anoEmFoco"
        :disabled="
          !['yearly', 'monthly', 'quarterly'].includes(tipoDeGantt)"
        class="inputtext"
        @change="renderChart(config)"
      >
        <option
          v-for="item in range(intervalo.início, intervalo.fim)"
          :key="item"
          :value="item"
        >
          {{ item }}
        </option>
      </select>
    </div>
    <hr class="mr1 f1">
    <div class="mb2 f1">
      <label class="label tc300">
        Exibir tarefas até nível
      </label>
      <div class="flex center">
        <input
          id="nivel"
          v-model.number="nívelMáximoVisível"
          type="range"
          name="nivel"
          min="1"
          :max="nívelMáximoPermitido"
          class="f1"
        >
        <output
          class="f1 ml1"
        >
          {{ nívelMáximoVisível }}
        </output>
      </div>
    </div>
  </div>

  <div class="flex mb2 spacebetween t13">
    <div class="f1">
      <ul class="legenda mb1">
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
    </div>

    <div class="f1">
      <ul class="legenda mb1">
        <li class="legenda__item mb05">
          <svg
            class="legenda__amostra"
            width="20"
            height="12"
          >
            <path
              d="M0,6L20,6"
              fill="none"
              stroke="#634A09"
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
              stroke="#807B65"
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
              stroke="#3B5881"
              stroke-width="1"
            />
          </svg>
          início e final reais
        </li>
      </ul>
      <ul class="legenda mb1">
        <li class="legenda__item mb05">
          <svg
            class="legenda__amostra"
            width="12"
            height="12"
          >
            <polygon
              points="0,0 0,12 12,0"
              fill="red"
              stroke="none"
              stroke-width="0"
            />
          </svg>
          marcos do projeto
        </li>
      </ul>
    </div>
  </div>
  <div
    id="gantt"
    ref="svgElementContainer"
  />
</template>
<script setup>
import { useResizeObserver } from '@vueuse/core';
import dayjs from 'dayjs';
import { debounce } from 'lodash';
import { useRoute, useRouter } from 'vue-router';

import {
  computed,
  nextTick,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import renderChart from '@/helpers/ganttChart';
import dependencyTypes from '@/consts/dependencyTypes';

const route = useRoute();
const router = useRouter();
// import cycles from './cycles';

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

const opçõesDeFiltragem = [
  {
    name: 'projeção',
    value: 'projeção',
  },
  {
    name: 'planejamento',
    value: 'planejamento',
  },
  {
    name: 'realização',
    value: 'realização',
  },
];

const tiposDeGráfico = [
  {
    name: 'projeto',
    value: 'overall',
  },
  // {
  //   name: 'sprint',
  //   value: 'sprint',
  // },
  {
    name: 'ano',
    value: 'yearly',
  },
  // {
  //   name: 'mês',
  //   value: 'monthly',
  // },
  // {
  //   name: 'trimestre',
  //   value: 'quarterly',
  // },
];

const tipoDeGantt = ref('overall');
const anoEmFoco = ref(null);
const filtroAtivo = ref('projeção');
const nívelMáximoVisível = ref(0);
const svgElementContainer = useTemplateRef('svgElementContainer');
const projetoId = route?.params?.projetoId;

const qualPropriedadeDeData = (términoOuInício) => {
  switch (filtroAtivo.value) {
    case 'realização':
      return términoOuInício === 'término' ? 'termino_real' : 'inicio_real';

    case 'planejamento':
      return términoOuInício === 'término' ? 'termino_planejado' : 'inicio_planejado';

    default:
      return términoOuInício === 'término' ? 'projecao_termino' : 'projecao_inicio';
  }
};

const dadosParaGantt = computed(() => props.data
  .filter((x) => (!nívelMáximoVisível.value ? true : x.nivel <= nívelMáximoVisível.value))
  .map((x) => ({
    ...x,
    end_date: x[qualPropriedadeDeData('término')],
    start_date: x[qualPropriedadeDeData('início')],
    title: x.tarefa,
    completion_percentage: x.percentual_concluido,
  }))
  // eslint-disable-next-line max-len
  .filter((x) => x.start_date && x.end_date));

const nívelMáximoPermitido = props.data
  .reduce((max, obj) => (obj.nivel > max.nivel ? obj : max))?.nivel || 0;

const intervalo = computed(() => dadosParaGantt.value.reduce((acc, cur) => {
  ['end_date', 'start_date'].forEach((propriedade) => {
    const ano = dayjs(cur[propriedade]).year();
    if (!acc.início || ano < acc.início) acc.início = ano;

    if (!acc.fim || ano > acc.fim) {
      acc.fim = ano;
    }
  });
  return acc;
}, { início: null, fim: null }));

const range = (s, e) => Array.from('x'.repeat(e - s + 1), (_, i) => s + i);

const date = new Date();

const métricas = computed(() => {
  switch (tipoDeGantt.value) {
    // case 'sprint':
    //   return {
    //     type: 'sprint', // Type of gantt
    //     year: anoEmFoco.value > 2000
    //       && anoEmFoco.value < 2050
    //       ? anoEmFoco.value
    //       : intervalo.value.início || date.getFullYear(),
    //     cycles,
    //   };

    case 'yearly':
      return {
        type: 'yearly', // Type of gantt
        year: anoEmFoco.value > 2000
          && anoEmFoco.value < 2050
          ? anoEmFoco.value
          : intervalo.value.início || date.getFullYear(),
      };

      // case 'monthly': // For Monthly Data
      //   return {
      //     type: 'monthly',
      //     month: `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`,
      //   };

      // case 'quarterly': // For quarterly or half yearly data
      //   return {
      //     type: 'quarterly',
      //     months: [
      //       'January 2023',
      //       'February 2023',
      //       'March 2023',
      //       'April 2023',
      //       'May 2023',
      //       'June 2023',
      //     ],
      //   };

    case 'overall':
    default:
      return {
        type: 'overall', // Type of gantt
        years: range(intervalo.value.início, intervalo.value.fim),
      };
  }
});

const config = computed(() => ({
  data: dadosParaGantt.value,
  element: svgElementContainer.value, // The element for rendering the chart
  box_padding: 10, // Padding for the blocks
  metrics: métricas.value,
  onClick: function onClick(data) {
    console.log(data); // Onclick of each node
  },
  onEmptyButtonClick: function onEmptyButtonClick() {
    router.push({
      name: 'projeto.TarefasCriar',
      params: {
        projetoId,
      },
    });
  },
  onAreaClick: function onAreaClick(location) {
    const distance = tipoDeGantt.value === 'overall'
      ? intervalo.value.fim - intervalo.value.início
      : 1;

    switch (location) {
      case 'right':
        anoEmFoco.value += distance + 1;
        break;

      case 'left':
        anoEmFoco.value -= distance - 1;
        break;

      default:
        break;
    }
  },
}));

useResizeObserver(svgElementContainer, debounce(async () => {
  await nextTick();

  renderChart(config.value);
}, 400));

watch(() => props.data, async () => {
  await nextTick();
  renderChart(config.value);
});

watch(() => nívelMáximoVisível.value, () => {
  renderChart(config.value);
});

watch(() => config.value.element, () => {
  if (config.value.element) {
    renderChart(config.value);
  }
});

onMounted(async () => {
  if (props.data.length) {
    anoEmFoco.value = intervalo.value.início;

    if (intervalo.value.início === intervalo.value.fim) {
      tipoDeGantt.value = 'yearly';
    }
    nívelMáximoVisível.value = nívelMáximoPermitido;
    await nextTick();

    if (config.value.element) {
      renderChart(config.value);
    }
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

  .hierarchy {
    box-sizing: content-box;
    display: block;
    margin: 0 auto;
    width: max-content;
    border-radius: 100px;
    border: 5px solid #FFF;
    height: 40px;
    line-height: 40px;
    text-align: center;
    overflow: hidden;
    padding: 0 1.35em;
    position: relative;
  }

  [data-is-milestone="true"] .hierarchy {
    border-radius: 0 100px 100px 100px;

    &::before {
      content: '';
      top: -6px;
      left: -6px;
      color: @vermelho;
      width: 26px;
      height: 26px;
      position: absolute;
      background-repeat: no-repeat;
      background-position: 50% 50%;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"><polygon fill="%23ff0000" points="0,0 0,20 20,0" stroke="%23ffffff" stroke-width="5px" /></svg>');
    }
  }

  .Single--Node {
    fill: #fff;
    stroke: @efetivo;
    stroke-width: 1;
    border-radius: 10px;
  }

  .Single--Node--estimated {
    stroke-dasharray: 3, 2;
    stroke: @estimativa;
  }

  .Single--Node--half-estimated {
    stroke-dasharray: 6, 3, 2, 3;
    stroke: #807B65;
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
