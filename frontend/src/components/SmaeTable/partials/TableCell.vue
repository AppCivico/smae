<template>
  <slot
    :name="`celula:${caminho}`"
    :caminho="caminho"
    :linha="linha"
  >
    <td :class="['table-cell', `table-cell--${caminho}`, `table-cell--${typeof conteudoColuna}`]">
      {{ conteudoColuna }}
    </td>
  </slot>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import obterParametroNoObjeto from '@/helpers/obterParametroNoObjeto';

export type Linha = { [key: string]: string | number | unknown; };

type ParametrosDaColuna = {
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
