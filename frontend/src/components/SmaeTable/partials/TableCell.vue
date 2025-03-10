<template>
  <slot
    :name="`celula-fora:${caminho}`"
    :caminho="caminho"
    :linha="linha"
  >
    <td
      :class="['table-cell', `table-cell--${caminho}`, `table-cell--${typeof conteudoColuna}`]"
      v-bind="$attrs"
    >
      <slot
        :name="`celula:${caminho}`"
        :caminho="caminho"
        :linha="linha"
      >
        {{ formatador ? formatador(conteudoColuna) : conteudoColuna || '-' }}
      </slot>
    </td>
  </slot>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineOptions } from 'vue';
import obterParametroNoObjeto from '@/helpers/obterParametroNoObjeto';
import type { Linha } from '../types/tipagem';

defineOptions({ inheritAttrs: false });

export type ParametrosDaColuna = {
  linha: Linha
  // eslint-disable-next-line @typescript-eslint/ban-types
  formatador?: Function
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
