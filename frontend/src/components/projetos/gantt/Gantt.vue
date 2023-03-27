<template>
  <div ref="svgElementContainer" />
</template>
<script setup>
/* eslint-disable no-nested-ternary */
import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch
} from 'vue';
import { createGanttChart } from './gantt-chart';

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

const dadosParaGantt = computed(() => props.data
  .map((x) => ({
    ...x,
    endDate: x.termino_real || x.termino_planejado,
    startDate: x.inicio_real || x.inicio_planejado,
    dependsOn: x.dependencias.map((y) => y.dependencia_tarefa_id) || [],
  }))
  // eslint-disable-next-line max-len
  .filter((x) => (x.startDate && x.duration) || (x.endDate && x.duration) || (x.startDate && x.endDate))
  .map((x) => ({
    ...x,
    label: x.tarefa,
    endDate: x.endDate ? new Date(x.endDate) : undefined,
    startDate: x.startDate ? new Date(x.startDate) : undefined,
  })));

const svgElementContainer = ref(null);

function renderChart() {
  createGanttChart(
    svgElementContainer.value,
    dadosParaGantt.value,
    {
      elementHeight: 20,
      sortMode: 'date', // alternatively, 'childrenCount'
      svgOptions: {
        width: 1200,
        height: 400,
        fontSize: 12,
      },
    },
  );
}

watch(() => dadosParaGantt.value, async () => {
  await nextTick();
  renderChart(dadosParaGantt.value);
});

onMounted(async () => {
  if (dadosParaGantt.value.length) {
    await nextTick();
    renderChart(dadosParaGantt.value);
  }
});
</script>
