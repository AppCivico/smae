<template>
  <div
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
import {
  BarChart, CustomChart, HeatmapChart, LineChart, ScatterChart,
} from 'echarts/charts';
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import type { EChartsCoreOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { merge } from 'lodash';
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
  CustomChart,
  LineChart,
  HeatmapChart,
  ScatterChart,
  MarkLineComponent,
  MarkPointComponent,
  DataZoomComponent,
  ToolboxComponent,
]);

provide(THEME_KEY, 'light');

const formatoPadraoDeEtiquetaDeEixo = {
  fontSize: 14,
  fontFamily: 'Roboto',
  fontWeight: 600,
  color: '#142133',
};

const slots = useSlots();

const props = withDefaults(defineProps<{
  option: EChartsCoreOption,
  tooltipTemplate?:(params: TooltipOptions) => string
}>(), {
  option: () => ({}),
  tooltipTemplate: undefined,
});

const definirPadroes = (opcoes: EChartsCoreOption) => (merge({
  grid: {
    containLabel: true,
    right: 30,
    bottom: 0,
    left: 0,
  },
  tooltip: {
    confine: true,
    className: 'painel-flutuante',
  },
  xAxis: {
    axisLabel: {
      hideOverlap: false,
    },
  },
  yAxis: {
    nameTextStyle: {
      align: 'right',
    },
    axisLabel: formatoPadraoDeEtiquetaDeEixo,
  },
}, opcoes));

const el = ref(null);
const elementoPainelFlutuante = ref<HTMLElement | null>(null);
const conteudoPainelFlutuante = ref<VNode[] | null>(null);

const preparedOptions = computed((): EChartsCoreOption => {
  const { tooltipTemplate } = props;
  if (!tooltipTemplate && !slots['painel-flutuante']) {
    return definirPadroes(props.option);
  }

  return {
    ...definirPadroes(props.option),
    tooltip: {
      trigger: 'item',
      renderMode: 'html',
      confine: true,
      className: 'painel-flutuante',
      formatter: (params: unknown) => {
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
              <div style="color: ${params.color}" class="painel-flutuante__conteudo">
                ${tooltipText}
              </div>
            `;
          }

          default:
            return `
              <div style="color: ${params.color}" class="painel-flutuante__conteudo">
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
