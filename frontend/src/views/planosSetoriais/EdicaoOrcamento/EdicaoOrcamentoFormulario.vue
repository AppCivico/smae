<script setup lang="ts">
import { watch } from 'vue';
import {
  ErrorMessage,
  Field, FieldArray, useForm, useIsFormDirty,
} from 'vee-validate';
import CheckClose from '@/components/CheckClose.vue';
import LabelFromYup from '@/components/LabelFromYup.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import months from '@/consts/months';
import { permissaoEdicaoOrcamento as schema } from '@/consts/formSchemas';

const mesesDisponíveis = months.map((x, i) => ({ nome: x, id: i + 1 }));
const camposSelecaoConfig = ['previsao_custo_disponivel', 'planejado_disponivel', 'execucao_disponivel'];

type Props = {
  orcamentoConfig: any
};
type Emits = {
  submit: [Record<string, unknown>]
};
const props = defineProps<Props>();
const emits = defineEmits<Emits>();

const { handleSubmit, resetForm } = useForm({
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  emits('submit', valoresControlados);
});

watch(() => props.orcamentoConfig, () => {
  resetForm({
    values: {
      orcamento_config: props.orcamentoConfig,
    },
  });
}, { immediate: true });
</script>

<template>
  <div class="edicao-orcamento-formulario">
    <div class="flex spacebetween center mb2">
      <TituloDaPagina />

      <hr class="ml2 f1">

      <CheckClose :formulario-sujo="formularioSujo" />
    </div>

    <form @submit="onSubmit">
      <FieldArray
        v-slot="{ fields }"
        name="orcamento_config"
      >
        <div
          v-for="(field, idx) in fields"
          :key="field.key"
          class="mb2"
        >
          <h4>{{ field.value.ano_referencia }}</h4>

          <Field
            :name="`orcamento_config[${idx}].id`"
            type="hidden"
          />

          <div
            v-for="campo in camposSelecaoConfig"
            :key="`${field.value.ano_referencia}--${campo}`"
            class="mb05"
          >
            <LabelFromYup
              v-slot="{ label }"
              :name="`orcamento_config[${idx}].${campo}`"
              :classe-label="false"
              :schema="schema.fields.orcamento_config.innerType"
            >
              <Field
                v-slot="{ value, handleChange, field: fieldCheckbox }"
                :name="`orcamento_config[${idx}].${campo}`"
                type="checkbox"
              >
                <input
                  :id="fieldCheckbox.name"
                  class="inputcheckbox"
                  type="checkbox"
                  :checked="value"
                  @input="ev => handleChange(ev.target.checked)"
                >
              </Field>

              <span>{{ label }}</span>
            </labelfromyup>
          </div>

          <div class="f1 mt1 mb2">
            <LabelFromYup
              :schema="schema.fields.orcamento_config.innerType"
              name="execucao_disponivel_meses"
            />

            <Field
              v-slot="{ value, handleChange }"
              :name="`orcamento_config[${idx}].execucao_disponivel_meses`"
            >
              <AutocompleteField
                name="execucao_disponivel_meses"
                :controlador="{ busca: '', participantes: value }"
                :v-model="handleChange"
                :grupo="mesesDisponíveis"
                label="nome"
              />
            </Field>

            <ErrorMessage
              :name="`orcamento_config[${idx}].execucao_disponivel_meses`"
              class="error-msg"
            />
          </div>
        </div>
      </FieldArray>

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button class="btn">
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </form>
  </div>
</template>
