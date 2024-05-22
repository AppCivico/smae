<template>
  <div>
    <v-chart
      v-if="option"
      class="chart"
      :option="option"
    />
  </div>
</template>
<script setup>
import { use } from 'echarts/core';
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';

import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

import { provide } from 'vue';

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
</script>
<style scoped>
.chart {
  height: 400px;
  /* background-color: pink */
}
</style>
