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
import obterPropriedadeNoObjeto from '@/helpers/objetos/obterPropriedadeNoObjeto';
import { computed } from 'vue';
import { RouteLocationRaw } from 'vue-router';
import type { Linha } from '../tipagem';

export type EditButtonProps = {
  rotaEditar?: string | RouteLocationRaw
  parametroDaRotaEditar?: string
  parametroNoObjetoParaEditar?: string
};

type Props = Omit<EditButtonProps, 'parametroDaRotaEditar' | 'parametroNoObjetoParaEditar'> & {
  linha: Linha,
  parametroDaRotaEditar: string
  parametroNoObjetoParaEditar: string
};

const props = defineProps<Props>();

const parametrosEditar = computed<RouteLocationRaw>(() => {
  const valorDoParametro = obterPropriedadeNoObjeto(props.parametroNoObjetoParaEditar, props.linha);

  if (typeof props.rotaEditar === 'string') {
    return `${props.rotaEditar}/${valorDoParametro}`;
  }

  return {
    ...props.rotaEditar,
    params: {
      [props.parametroDaRotaEditar]: valorDoParametro,
    },
  };
});
</script>
