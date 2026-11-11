<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { AnyObjectSchema } from 'yup';

import buscarDadosDoYup from './camposDeFormulario/helpers/buscarDadosDoYup';

const props = defineProps({
  as: {
    type: String,
    default: 'small',
    validator(value: string) {
      return ['small', 'p', 'span', 'div'].includes(value);
    },
  },
  explicacao: {
    type: String,
    default: undefined,
  },
  name: {
    type: String,
    default: '',
  },
  schema: {
    type: Object as PropType<AnyObjectSchema>,
    default: () => null,
  },
});

const caminhoNoSchema = computed(() => (props.schema && props.name
  ? buscarDadosDoYup(props.schema, props.name)
  : null));

const texto = computed<string>(() => props.explicacao
  || caminhoNoSchema.value?.spec?.meta?.explicacao
  || '');
</script>

<template>
  <component
    :is="$props.as"
    v-if="texto || $slots.default"
    class="smae-explicacao-campo explicacao"
  >
    <slot :explicacao="texto">
      {{ texto }}
    </slot>
  </component>
</template>
<style scoped lang="less">
.smae-explicacao-campo {
  div + &,
  textarea + &,
  input:not([type='checkbox']):not([type='radio']) + & {
    display: block;
    margin-top: 0.5em;
  }
}
</style>
