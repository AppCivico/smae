<template>
  <td>
    <slot
      :caminho="caminho"
      :linha="linha"
    >
      {{ conteudoColuna }}
    </slot>
  </td>
</template>

<script lang="ts" setup>
import { computed, defineProps, defineSlots } from 'vue';

export type Linha = { [key: string]: string | number | unknown; };

type ParametrosDaColuna = {
  linha: Linha
  caminho: string
};

type Props = ParametrosDaColuna & {
  classe?: string
};

type Slots = {
  default(props: ParametrosDaColuna): any
};

const props = defineProps<Props>();
const slots = defineSlots<Slots>();

const conteudoColuna = computed(() => {
  if (!props.caminho.includes('.')) {
    return props.linha[props.caminho];
  }

  const caminho = props.caminho.split('.');
  const saida = caminho.reduce<any>((amount, itemCaminho) => {
    if (!amount[itemCaminho]) {
      // eslint-disable-next-line no-console
      console.warn(`Item "${itemCaminho}" não encontrado encontrado no caminho "${props.caminho}"`);
      return amount;
    }

    return amount[itemCaminho];
  }, props.linha);

  return saida;
});
</script>
