<script setup lang="ts">
import { computed, watch } from 'vue';
import { format, subDays } from 'date-fns';
import { useRoute, useRouter } from 'vue-router';
import { Field, useForm, ErrorMessage } from 'vee-validate';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import { comunicadosGeraisFiltrosSchema, comunicadosGeraisFiltrosSchemaTipoOpcoes } from '@/consts/formSchemas';

type FieldsProps = {
  class?: string
  nome: string
  tipo: string
  opcoes?: string[]
};

const schema = comunicadosGeraisFiltrosSchema;

const $route = useRoute();
const $router = useRouter();

const campos = computed<FieldsProps[]>(() => [
  { class: 'fg999', nome: 'palavra_chave', tipo: 'text' },
  {
    class: 'fb25', nome: 'tipo', tipo: 'select', opcoes: comunicadosGeraisFiltrosSchemaTipoOpcoes,
  },
  { class: 'fb25', nome: 'data_inicio', tipo: 'date' },
  { class: 'fb25', nome: 'data_fim', tipo: 'date' },
]);

const { handleSubmit, isSubmitting, setValues } = useForm({
  validationSchema: comunicadosGeraisFiltrosSchema,
  initialValues: $route.query,
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  $router.replace({
    query: {
      ...$route.query,
      ...valoresControlados,
    },
  });
});

watch(() => $route.query, (val) => {
  setValues(val);
}, { deep: true });

const valoresIniciais = computed(() => {
  const today = new Date();
  const formatoData = 'yyyy-MM-dd';

  return {
    data_inicio: format(subDays(today, 7), formatoData),
    data_fim: format(today, formatoData),
    aba: 'comunicados-nao-lidos',
  };
});
</script>

<template>
  <section class="comunicados-gerais-filtro">
    <FormularioQueryString
      :valores-iniciais="valoresIniciais"
    >
      <form
        class="flex center g2"
        @submit="onSubmit"
      >
        <div class="flex g2 fg999">
          <div
            v-for="campo in campos"
            :key="campo.nome"
            :class="['f1', campo.class]"
          >
            <LabelFromYup
              :name="campo.nome"
              :schema="schema"
            />

            <Field
              v-if="campo.tipo !== 'select'"
              class="inputtext light mb1"
              :name="campo.nome"
              :type="campo.tipo"
            />
            <Field
              v-else
              class="inputtext light mb1"
              :name="campo.nome"
              as="select"
            >
              <option
                v-for="opcao in campo.opcoes"
                :key="`comunicado-tipo--${opcao}`"
                :value="opcao"
              >
                {{ opcao }}
              </option>
            </Field>

            <ErrorMessage
              class="error-msg mb1"
              :name="campo.nome"
            />
          </div>
        </div>

        <button
          type="submit"
          class="btn"
          :disabled="isSubmitting"
        >
          Filtrar
        </button>
      </form>
    </FormularioQueryString>
  </section>
</template>
