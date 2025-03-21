<script lang="ts" setup>
import criaOpcoesDosGraficosDeVariaveis from '@/helpers/criaOpcoesDosGraficosDeVariaveis';
import GraficoDashboard, { TooltipOptions } from '@/components/graficos/GraficoDashboard.vue';
import quadroDeVariaveis from '@/consts/quadroDeVariaveis';
import { computed } from 'vue';
import { cloneDeep } from 'lodash';

const props = defineProps<{
  variaveis: Record<string, number>;
  cores?: string[];
}>();

const variaveisTratada = computed(() => {
  const clone = cloneDeep(props.variaveis);
  delete clone.total;
  return clone;
});

const labels = computed(() => Object.keys(variaveisTratada.value));
const labelsTraduzidas = computed(() => labels.value.map((label) => quadroDeVariaveis[label]));
const valores = computed(() => Object.values(variaveisTratada.value));

const chartOptions = computed(
  () => criaOpcoesDosGraficosDeVariaveis(labelsTraduzidas.value, valores.value, props.cores),
);
</script>

<template>
  <GraficoDashboard
    :option="chartOptions"
  />
</template>
