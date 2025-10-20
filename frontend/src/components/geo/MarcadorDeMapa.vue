<template>
  <svg
    v-bind="$attrs"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      :d="pathData"
      :fill-rule="pathFillRule"
      :clip-rule="pathClipRule"
      :fill="pathFill"
      :stroke="pathStroke"
    />
  </svg>
</template>

<script setup>
import {
  determinarAtributosPath,
  determinarCores,
} from '@/helpers/gerarSvgMarcador';
import { computed } from 'vue';

const props = defineProps({
  cor: {
    type: [String, Object],
    default: 'padrão',
  },
  variante: {
    type: String,
    default: 'padrao',
    validator: (value) => ['padrao', 'sem-contorno', 'so-contorno', 'com-contorno'].includes(value),
  },
});

const cores = computed(() => determinarCores(props.cor));
const attrs = computed(() => determinarAtributosPath(props.variante, cores.value));

const pathData = computed(() => attrs.value.d);
const pathFillRule = computed(() => attrs.value.fillRule);
const pathClipRule = computed(() => attrs.value.clipRule);
const pathFill = computed(() => attrs.value.fill);
const pathStroke = computed(() => attrs.value.stroke);

</script>
