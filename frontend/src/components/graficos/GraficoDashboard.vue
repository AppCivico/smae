<template>
  <div>
    <v-chart
      v-if="option"
      ref="el"
      :key="chaveDeRender"
      :autoresize="{ throttle: 400 }"
      class="chart"
      :option="option"
    />
  </div>
</template>
<script setup>
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  MarkLineComponent,
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
  MarkLineComponent,
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
</script>
<style scoped>
.chart {
  height: 400px;
}
</style>
