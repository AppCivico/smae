<template>
  <SmaeLink :to="parametrosEditar">
    <svg
      width="20"
      height="20"
    >
      <use xlink:href="#i_edit" />
    </svg>
  </SmaeLink>
</template>

<script lang="ts" setup>
import { RouteLocationRaw } from 'vue-router';

import { computed } from 'vue';
import obterParametroNoObjeto from '@/helpers/obterParametroNoObjeto';
import { type Linha } from './TableCell.vue';

export type EditButtonProps = {
  rotaEditar?: string | RouteLocationRaw
  parametroDaRota?: string
  parametroNoObjeto?: string
};

type Props = Omit<EditButtonProps, 'parametroDaRota' | 'parametroNoObjeto'> & {
  linha: Linha,
  parametroDaRota: string
  parametroNoObjeto: string
};

const props = defineProps<Props>();

const parametrosEditar = computed<RouteLocationRaw>(() => {
  const valorDoParametro = obterParametroNoObjeto(props.parametroNoObjeto, props.linha);

  if (typeof props.rotaEditar === 'string') {
    return `${props.rotaEditar}/${valorDoParametro}`;
  }

  return {
    ...props.rotaEditar,
    params: {
      [props.parametroDaRota]: valorDoParametro,
    },
  };
});
</script>
