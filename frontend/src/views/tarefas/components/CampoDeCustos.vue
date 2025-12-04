<script setup lang="ts">
import { getYear, parseISO } from 'date-fns';
import { Field, FieldArray, useField } from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { AnyObjectSchema } from 'yup';

import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import dateTimeToDate from '@/helpers/dateTimeToDate';
import dinheiro from '@/helpers/dinheiro';
import { useTarefasStore } from '@/stores/tarefas.store';

const { itemParaEdicao } = useTarefasStore();

type Props = {
  schema: AnyObjectSchema,
  values: Record<string, any>,
  tipo: 'estimado' | 'real'
};

type Emits = {
  (event: 'limpar-campos'): void
};
const props = withDefaults(
  defineProps<Props>(),
  {
    values: () => ({}),
  },
);

const emit = defineEmits<Emits>();

function obterListaDeAnos(inicio: string, termino?: string): number[] {
  if (!inicio) {
    return [];
  }

  const anoInicio = getYear(parseISO(inicio));
  let anoTermino: number;

  if (termino) {
    anoTermino = getYear(parseISO(termino));
  } else if (props.tipo === 'estimado') {
    anoTermino = anoInicio + 10;
  } else if (props.tipo === 'real') {
    anoTermino = getYear(new Date());
  } else {
    throw new Error(`Tipo "${props.tipo}" não válido`);
  }

  if (anoInicio === anoTermino) {
    return [anoInicio];
  }

  return [...Array.from(
    { length: anoTermino - anoInicio + 1 },
    (_, i) => anoInicio + i,
  )];
}

const listaDeAnos = ref<number[]>([]);

// const usarValoresAnualizado = computed<boolean>(() => listaDeAnos.value.length > 1);

const nomeDoCampo = computed(() => `custo_${props.tipo}_anualizado`);

const listaDeWatchers = {
  estimado: [
    () => props.values?.inicio_planejado,
    () => props.values?.termino_planejado,
  ],
  real: [
    () => props.values?.inicio_real,
    () => props.values?.termino_real,
  ],
};

watch(
  listaDeWatchers[props.tipo],
  ([inicio, termino]) => {
    listaDeAnos.value = obterListaDeAnos(inicio, termino);
  },
  { immediate: true },
);

// watch(usarValoresAnualizado, () => {
//   emit('limpar-campos');
// }, { immediate: true });

</script>

<template>
  a
</template>
