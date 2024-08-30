<script setup lang="ts">
import { computed, watch } from 'vue';
import { Field, useForm } from 'vee-validate';

import LabelFromYup from '@/components/LabelFromYup.vue';
import { comunidadosGeraisFiltrosSchema } from '@/consts/comunicadosGerais.ts';

import { useRoute, useRouter } from 'vue-router';

type FieldsProps = {
  class?: string
  nome: string
  tipo: string
};

const schema = comunidadosGeraisFiltrosSchema;

const $route = useRoute();
const $router = useRouter();

const campos = computed<FieldsProps[]>(() => [
  { class: 'fg999', nome: 'palavra_chave', tipo: 'text' },
  { class: 'fb25', nome: 'data_inicio', tipo: 'date' },
  { class: 'fb25', nome: 'data_fim', tipo: 'date' },
]);

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: comunidadosGeraisFiltrosSchema,
  initialValues: $route.query,
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  $router.replace({
    query: valoresControlados,
  });
});

</script>

<template>
  <section class="comunicados-gerais-filtro">
    <form
      class="flex center  g2"
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
            class="inputtext light mb1"
            :name="campo.nome"
            :type="campo.tipo"
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
  </section>
</template>
