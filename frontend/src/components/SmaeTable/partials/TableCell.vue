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
  caminho: string
  ehDadoComputado?: boolean
  formatador?: (args: unknown) => number | string
};

type Props = ParametrosDaColuna & {
  classe?: string
};

const slots = defineSlots();
const props = defineProps<Props>();

const conteudoColuna = computed(() => {
  if (props.ehDadoComputado
    || slots[`celula:${props.caminho}`]
    || slots[`celula-fora:${props.caminho}`]
  ) {
    return undefined;
  }

  return obterParametroNoObjeto(props.caminho, props.linha);
});
</script>
