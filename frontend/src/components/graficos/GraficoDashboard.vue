<template>
  <div>
    <v-chart
      v-if="option"
      ref="el"
      :autoresize="{ throttle: 400 }"
      class="chart"
      :option="preparedOptions"
    />
  </div>
</template>
<script lang="ts" setup>
import {
  defineProps, provide, ref, computed,
} from 'vue';

import { BarChart, LineChart, HeatmapChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import VChart, { THEME_KEY } from 'vue-echarts';

export type TooltipOptions = {
  data: number,
  dataIndex: number,
  name: string;
};

use([
  CanvasRenderer,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  LegendComponent,
  GridComponent,
  BarChart,
  LineChart,
  HeatmapChart,
  MarkLineComponent,
  MarkPointComponent,
]);

provide(THEME_KEY, 'light');

const props = withDefaults(defineProps<{
  option: object,
  tooltipTemplate?:(params: TooltipOptions) => string
}>(), {
  option: () => ({}),
  tooltipTemplate: undefined,
});

const el = ref(null);

const preparedOptions = computed(() => {
  const { tooltipTemplate } = props;
  if (!tooltipTemplate) {
    return props.option;
  }

  return {
    ...props.option,
    tooltip: {
      trigger: 'item',
      // show: true,
      // alwaysShowContent: true,
      renderMode: 'html',
      confine: true,
      className: 'grafico-dashboard__tooltip',
      formatter: (params: any) => {
        const tooltipText = tooltipTemplate({
          data: params.data,
          dataIndex: params.dataIndex,
          name: params.name,
        });

        return `
          <div style="color: ${params.color}" class="grafico-dashboard__tooltip-conteudo">
            ${tooltipText}
          </div>
        `;
      },
    },
  };
});
</script>

<style scoped>
.chart {
  height: 400px;
}
</style>

<style lang="less">
.grafico-dashboard__tooltip {
  background-color: #E8E8E8 !important;
  border-radius: 10px !important;
  padding: 5px !important;
  border: none !important;

  display: none;
  flex-direction: column;

  &:before, &:after {
    content: '';
    margin: 0 auto;
    width: 60%;
    height: 1px;
    color: #232046;
    background: #232046;
  }
}
.grafico-dashboard__tooltip:has(.grafico-dashboard__tooltip-conteudo) {
  display: flex !important;
}

.grafico-dashboard__tooltip-conteudo {
  padding: 5px 0 8px;
}
</style>
