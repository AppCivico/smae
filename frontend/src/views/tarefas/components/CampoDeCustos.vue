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

function obterListaDeAnos(inicio: string, termino: string): number[] {
  if (!(inicio && termino)) {
    return [];
  }

  const anoInicio = getYear(parseISO(inicio));
  const anoTermino = getYear(parseISO(termino));

  if (anoInicio === anoTermino) {
    return [];
  }

  return [...Array.from(
    { length: anoTermino - anoInicio + 1 },
    (_, i) => anoInicio + i,
  )];
}

const listaDeAnos = ref<number[]>([]);

function obterNameDoCampo(name: string, anualizado = false) {
  const novoNome = `${name}_${props.tipo}`;

  if (anualizado) {
    return `${novoNome}_anualizado`;
  }

  return novoNome;
}

const usarValoresAnualizado = computed<boolean>(() => listaDeAnos.value.length > 1);

const nomeDoCampo = computed(() => {
  if (usarValoresAnualizado.value) {
    return `custo_${props.tipo}_anualizado`;
  }

  return `custo_${props.tipo}`;
});

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

watch(usarValoresAnualizado, () => {
  emit('limpar-campos');
}, { immediate: true });

</script>

<template>
  <div class="flex g2 mb1">
    <div
      v-if="!usarValoresAnualizado"
      class="f1 mb1"
    >
      <LabelFromYup
        :name="nomeDoCampo"
        :schema="$props.schema"
      />
      <MaskedFloatInput
        v-if="!$props.values?.n_filhos_imediatos"
        :name="nomeDoCampo"
        :value="$props.values[nomeDoCampo]"
        class="inputtext light mb1"
      />
      <input
        v-else
        type="text"
        :name="nomeDoCampo"
        :value="dinheiro(itemParaEdicao[nomeDoCampo])"
        class="inputtext light mb1"
        disabled
      >
      <ErrorMessage
        class="error-msg mb1"
        :name="nomeDoCampo"
      />
    </div>

    <div
      v-else
      class="f1 mb1"
    >
      <legend class="label mt2 mb1">
        {{ schema.fields[nomeDoCampo]?.spec.label }}
      </legend>

      <FieldArray
        v-slot="{ fields, push, remove }"
        :name="nomeDoCampo"
      >
        <div
          v-for="(field, idx) in fields"
          :key="`${nomeDoCampo}--${field.key}`"
          class="flex g2"
        >
          <div class="f2 mb1">
            <SmaeLabel
              class="tc300"
              :schema="schema.fields[nomeDoCampo].innerType"
              name="ano"
            />

            <Field
              :name="`${nomeDoCampo}[${idx}].ano`"
              class="inputtext light mb1"
              as="select"
            >
              <option value="">
                Selecionar
              </option>
              <option
                v-for="item in listaDeAnos"
                :key="item"
                :value="item"
              >
                {{ item }}
              </option>
            </Field>
          </div>

          <div class="f2 mb1">
            <SmaeLabel
              class="tc300"
              :schema="schema.fields[nomeDoCampo].innerType"
              name="ano"
            />

            <MaskedFloatInput
              :name="`${nomeDoCampo}[${idx}].valor`"
              :value="field.value?.valor"
              class="inputtext light mb1"
            />
          </div>

          <button
            class="like-a__text addlink"
            aria-label="excluir"
            title="excluir"
            type="button"
            @click="() => {
              remove(idx);
            }"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </div>

        <button
          class="like-a__text addlink"
          type="button"
          @click="push({
            ano: null,
            valor: 0
          })"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg>Adicionar valor estimado
        </button>
      </FieldArray>
    </div>
  </div>
</template>
