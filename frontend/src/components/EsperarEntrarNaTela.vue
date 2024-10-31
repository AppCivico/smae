<template>
  <template v-if="$slots.default">
    <component
      :is="$props.marcadorDePosicao"
      v-if="!entrouNaTela"
      ref="elementoTemporario"
      class="marcador-de-posicao"
      v-bind="$attrs"
    >
      <slot
        v-if="$slots.marcadorDePosicao"
        name="conteudoDoMarcadorDePosicao"
      >
        <LoadingComponent />
      </slot>
    </component>
    <slot
      v-else-if="entrouNaTela"
    />
  </template>
</template>
<script lang="ts" setup>
import isValidHtmlTag from '@/helpers/isValidHtmlTag';
import { defineProps, onMounted, ref } from 'vue';

defineOptions({
  inheritAttrs: false,
});

const emit = defineEmits(['entrouNaTela']);

const props = defineProps({
  marcadorDePosicao: {
    type: String,
    default: 'div',
    validator(value: string) { return isValidHtmlTag(value); },
  },
  // quanto do elemento deve estar presente na tela para ser considerado visível
  limiar: {
    type: Number,
    default: 1,
    validator: (value: number) => value >= 0 && value <= 1,
  },
});

const elementoTemporario = ref<HTMLElement | null>(null);
const entrouNaTela = ref(false);

const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting === true && elementoTemporario.value) {
    entrouNaTela.value = true;
    emit('entrouNaTela');
    observer.disconnect();
  }
}, { threshold: [props.limiar] });

onMounted(() => {
  if (elementoTemporario.value) {
    observer.observe(elementoTemporario.value);
  }
});
</script>
<style scoped>
.marcador-de-posicao + .marcador-de-posicao {
  min-height: 2rem;
}
</style>
