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

const ordemDasVariaveis = [
  'a_coletar_atrasadas',
  'a_coletar_prazo',
  'coletadas_a_conferir',
  'conferidas_a_liberar',
  'liberadas',
];

const variaveisTratada = computed(() => {
  const clone = cloneDeep(props.variaveis);
  delete clone.total;

  return ordemDasVariaveis.reduce((acc, chave) => {
    if (chave in clone) {
      acc[chave] = clone[chave];
    }
    return acc;
  }, {} as Record<string, number>);
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
