<template>
  <div
    v-once
    v-bind="$attrs"
  >
    <v-chart
      v-if="option"
      ref="el"
      :autoresize="{ throttle: 400 }"
      class="chart"
      :option="preparedOptions"
    />
  </div>

  <div
    ref="elementoPainelFlutuante"
    class="painel-flutuante__conteudo"
    hidden
  >
    <component
      :is="() => conteudoPainelFlutuante"
    />
  </div>
</template>
<script lang="ts" setup>
import { BarChart, HeatmapChart, LineChart } from 'echarts/charts';
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
import type { ECBasicOption } from 'echarts/types/dist/shared';
import type { VNode } from 'vue';
import {
  computed,
  nextTick,
  provide,
  ref,
  useSlots,
} from 'vue';
import VChart, { THEME_KEY } from 'vue-echarts';

defineOptions({
  inheritAttrs: false,
});

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

const slots = useSlots();

const props = withDefaults(defineProps<{
  option: ECBasicOption,
  tooltipTemplate?:(params: TooltipOptions) => string
}>(), {
  option: () => ({}),
  tooltipTemplate: undefined,
});

const el = ref(null);
const elementoPainelFlutuante = ref<HTMLElement | null>(null);
const conteudoPainelFlutuante = ref<VNode[] | null>(null);

const preparedOptions = computed((): ECBasicOption => {
  const { tooltipTemplate } = props;
  if (!tooltipTemplate && !slots['painel-flutuante']) {
    return props.option;
  }

  return {
    ...props.option,
    tooltip: {
      trigger: 'item',
      renderMode: 'html',
      confine: true,
      className: 'painel-flutuante',
      formatter: (params: any) => {
        switch (true) {
          case !!slots['painel-flutuante']:
            elementoPainelFlutuante.value?.setAttribute('hidden', '');
            conteudoPainelFlutuante.value = slots['painel-flutuante'](params);

            nextTick(() => {
              if (elementoPainelFlutuante.value?.hasAttribute('hidden')) {
                elementoPainelFlutuante.value.removeAttribute('hidden');
              }
            });

            return elementoPainelFlutuante.value;

          case !!tooltipTemplate: {
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
          }
          default:
            return `
              <div style="color: ${params.color}" class="grafico-dashboard__tooltip-conteudo">
                ${params.name}: ${params.data}
              </div>
            `;
        }
      },
      ...((props.option.tooltip as object) || {}),
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

  &:before,
  &:after {
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
