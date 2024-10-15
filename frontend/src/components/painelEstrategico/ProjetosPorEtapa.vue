<template>
  <GraficoDashboard
    class="pb3"
    :option="projetosPorEtapaChartOptions"
    :tooltip-template="formatTooltip"
  />
</template>

<script lang="ts" setup>
import { defineProps, computed } from 'vue';
import criaOpcoesDoGraficoDeProjetos from '@/helpers/criaOpcoesDoGraficoDeProjetos';
import GraficoDashboard, { TooltipOptions } from '@/components/graficos/GraficoDashboard.vue';

const props = defineProps({
  projetosPorEtapas: {
    type: Array,
    required: true,
  },
});

const etapas = computed(() => props.projetosPorEtapas.map((item) => item.etapa));
const quantidades = computed(() => props.projetosPorEtapas.map((item) => item.quantidade));

const projetosPorEtapaChartOptions = computed(
  () => criaOpcoesDoGraficoDeProjetos(etapas.value, quantidades.value),
);

function formatTooltip(param: TooltipOptions) {
  return `
    <div class="projeto-por-etapa-tooltip">
      <h5 class="projeto-por-etapa-tooltip__valor">${param.data}</h5>
      <h6 class="projeto-por-etapa-tooltip__label">${param.name}</h6>

      <span class="projeto-por-etapa-tooltip__porcentagem">
        27%
      </span>
    </div>
  `;
}

</script>

<style>
.projeto-por-etapa-tooltip__valor,
.projeto-por-etapa-tooltip__label,
.projeto-por-etapa-tooltip__porcentagem {
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
}

.projeto-por-etapa-tooltip__valor {
  font-size: 15px;
}

.projeto-por-etapa-tooltip__label {
  text-transform: uppercase;
  font-size: 10px;
  color: #7E858D;
}

.projeto-por-etapa-tooltip__porcentagem {
  font-size: 30px;
  font-weight: 600;
  line-height: 39px;
  }
</style>
