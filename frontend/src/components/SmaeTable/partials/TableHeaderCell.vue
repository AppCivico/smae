<template>
  <component
    :is="elementoEnvelope"
    class="table-header-cell"
    v-bind="props.atributos"
  >
    <slot>
      {{ conteudo }}
    </slot>
  </component>
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

const elementoEnvelope = computed<'td' | 'th'>(() => (props.ehCabecalho ? 'th' : 'td'));

const conteudo = computed(() => (!props.schema || !props.chave
  ? props.label || props.chave
  : buscarDadosDoYup(props.schema, props.chave)?.spec?.label) || props.label || props.chave);
</script>
