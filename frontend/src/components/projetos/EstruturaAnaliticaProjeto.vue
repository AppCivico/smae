<template>
  <div ref="svgElementContainer" />
</template>
<script setup>
import { select as d3Select } from 'd3';
import { OrgChart } from 'd3-org-chart';
import {
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

const chartReference = ref(null);
const svgElementContainer = ref(null);

function renderChart(dataFlattened) {
  if (!chartReference.value) {
    chartReference.value = new OrgChart();
  }
  chartReference.value
    .container(svgElementContainer.value)
    .data(dataFlattened)
    // .svgHeight(width - 10)
    // .svgWidth(height - 10)
    .nodeHeight((d) => 85)
    .nodeWidth((d) => 220)
    .childrenMargin((d) => 50)
    .compactMarginBetween((d) => 25)
    .compactMarginPair((d) => 50)
    .neightbourMargin((a, b) => 25)
    .siblingsMargin((d) => 25)
    .buttonContent(({ node, state }) => `<div style="px;color:#716E7B;border-radius:5px;padding:4px;font-size:10px;margin:auto auto;background-color:white;border: 1px solid #E4E2E9">
      <span style="font-size:9px">${node.children ? '<i class="fas fa-angle-up"></i>' : '<i class="fas fa-angle-down"></i>'}</span>
      ${node.data._directSubordinates}
      </div>`)
    .linkUpdate(function (d, i, arr) {
      d3Select(this)
        .attr('stroke', (d) => (d.data._upToTheRootHighlighted ? '#152785' : '#E4E2E9'))
        .attr('stroke-width', (d) => (d.data._upToTheRootHighlighted ? 5 : 1));

      if (d.data._upToTheRootHighlighted) {
        d3Select(this).raise();
      }
    })
    .nodeContent((d, i, arr, state) => {
      const color = '#FFFFFF';
      return `
<div style="background-color:${color}; position:absolute;margin-top:-1px; margin-left:-1px;width:${d.width}px;height:${d.height}px;border-radius:10px;border: 1px solid HSL(216, 9.8%, 90%)">
${d.data.hierarquia || d.data.numero ? `<span class="btn" style="box-sizing: content-box;position:absolute;margin-top:-20px;margin-left:${20}px;border-radius:100px;border:5px solid ${color};height:40px;line-height:40px;text-align:center;overflow:hidden;padding: 0 1.35em;">${d.data.hierarquia || d.data.numero}</span>` : `<span class="btn" style="position:absolute;top:-22px;left: 50%;transform: translateX(-50%);border:5px solid ${color};">Projeto</span>`}
  <div class="t10" style="color:#08011E;position:absolute;right:20px;top:17px;"><i class="fas fa-ellipsis-h"></i></div>
  ${d.data.idDoProjeto
          ? `<h3 class="t16 w700 nowrap" style="color:#08011E;margin-left:20px;margin-top:32px">${d.data.nome}</h3>`
          : `<h3 class="w700 t13 nowrap" style="color:#08011E;margin-left:20px;margin-top:32px">${d.data.nome || d.data.tarefa}</h3>`}
  ${d.data.atraso
          ? `<div class="error-msg t10" style="margin-left:20px;margin-top:3px;">
     <strong>${d.data.atraso}</strong> dias de atraso
   </div>`
          : ''
        }
 </div>
  `;
    })
    .render();

  chartReference.value
    .getChartState()
    .svg.on('wheel.zoom', null);
}

watch(() => props.data, async () => {
  await nextTick();
  renderChart(props.data);
});

onMounted(async () => {
  if (props.data.length) {
    await nextTick();
    renderChart(props.data);
  }
});
</script>
