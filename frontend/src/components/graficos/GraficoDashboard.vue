<template>
  <div>
    <v-chart
      v-if="option"
      ref="el"
      :key="chaveDeRender"
      class="chart"
      :option="option"
    />
  </div>
</template>
<script setup>
import { useResizeObserver } from '@vueuse/core';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { debounce } from 'lodash';
import { nextTick, provide, ref } from 'vue';
import VChart, { THEME_KEY } from 'vue-echarts';

use([
  CanvasRenderer,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  BarChart,
]);

provide(THEME_KEY, 'light');

defineProps({
  option: {
    type: Object,
    default: null,
  },
});

const el = ref(null);
const chaveDeRender = ref('');

useResizeObserver(el, debounce(async (entries) => {
  const entry = entries[0];
  const { width, height } = entry.contentRect;
  await nextTick();

  chaveDeRender.value = `${width}x${height}`;
}, 400));
</script>
<style scoped>
.chart {
  height: 400px;
}
</style>
