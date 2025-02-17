<template>
  <slot
    :name="`celula-fora:${caminho}`"
    :caminho="caminho"
    :linha="linha"
  >
    <td :class="['table-cell', `table-cell--${caminho}`, `table-cell--${typeof conteudoColuna}`]">
      <slot
        :name="`celula:${caminho}`"
        :caminho="caminho"
        :linha="linha"
      >
        {{ conteudoColuna || '-' }}
      </slot>
    </td>
  </slot>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import obterParametroNoObjeto from '@/helpers/obterParametroNoObjeto';
import type { Linha } from '../types/tipagem';

export type ParametrosDaColuna = {
  linha: Linha
  caminho: string
};

type Props = ParametrosDaColuna & {
  classe?: string
};
const props = defineProps<Props>();

const conteudoColuna = computed(() => {
  const conteudo = obterParametroNoObjeto(props.caminho, props.linha);

  return conteudo;
});
</script>
