<template>
  <component
    :is="elementoEnvelope"
    :class="['table-cell', `table-cell--${caminho}`, `table-cell--${typeof conteudoColuna}`]"
    v-bind="$attrs"
  >
    <slot
      :caminho="caminho"
      :linha="linha"
    >
      {{ conteudoColuna || '-' }}
    </slot>
  </component>
</template>

<script lang="ts" setup>
import obterParametroNoObjeto from '@/helpers/obterParametroNoObjeto';
import { computed } from 'vue';
import type { Linha } from '../tipagem';

defineOptions({ inheritAttrs: false });

type ParametrosDaCelula = {
  ehCabecalho?: boolean
  linha: Linha
  caminho: string
  formatador?: (args: unknown) => number | string
};

const slots = defineSlots();
const props = defineProps<ParametrosDaCelula>();

const conteudoColuna = computed((): unknown => {
  if (slots[`celula:${props.caminho}`]) {
    return undefined;
  }

  const conteudo = obterParametroNoObjeto(props.caminho, props.linha);

  return typeof props.formatador === 'function'
    ? props.formatador(conteudoColuna)
    : conteudo;
});

const elementoEnvelope = computed<'td' | 'th'>(() => (props.ehCabecalho ? 'th' : 'td'));
</script>
