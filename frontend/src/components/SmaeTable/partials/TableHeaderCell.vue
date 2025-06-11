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
import buscarDadosDoYup from '@/components/camposDeFormulario/helpers/buscarDadosDoYup';
import { computed, defineProps } from 'vue';
import type { AnyObjectSchema } from 'yup';
import type { Coluna } from '../tipagem';

type Props = Coluna & {
  schema?: AnyObjectSchema,
  atributos?: Record<string, unknown>,
};

const props = defineProps<Props>();

const conteudo = computed(() => (!props.schema || !props.chave
  ? props.label || props.chave
  : buscarDadosDoYup(props.schema, props.chave)?.spec?.label) || props.label || props.chave);
</script>
