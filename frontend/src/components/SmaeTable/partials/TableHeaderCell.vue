<template>
  <th
    class="table-header-cell"
    v-bind="props.atributos"
  >
    <slot>
      {{ conteudo }}
    </slot>
  </th>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue';
import type { AnyObjectSchema } from 'yup';
import buscarDadosDoYup from '@/components/camposDeFormulario/helpers/buscarDadosDoYup';
import type { Coluna } from '../tipagem';

type Props = Coluna & {
  schema?: AnyObjectSchema,
  atributos?: Record<string, unknown>,
};

const props = defineProps<Props>();

const conteudo = computed(() => {
  if (!props.schema || !props.chave) {
    return props.label;
  }

  const dadosYup = buscarDadosDoYup(props.schema, props.chave)?.spec?.label;
  if (dadosYup) {
    return dadosYup;
  }

  return props.label || props.chave;
});
</script>
