<script setup lang="ts">
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import LabelFromYup from '@/components/LabelFromYup.vue';
import { cicloAtualizacaoFiltrosSchema as schema } from '@/consts/formSchemas';
import maskMonth from '@/helpers/maskMonth';
import { useEquipesStore } from '@/stores/equipes.store';
import type { EquipeRespItemDto } from '@back/equipe-resp/entities/equipe-resp.entity.ts';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

type FieldsProps = {
  class?: string
  nome: string
  tipo: string
  opcoes?: EquipeRespItemDto[]
  placeholder?: string
  mask?: (el: HTMLInputElement) => void
};

const route = useRoute();
const router = useRouter();

const valoresIniciais = {
  aba: 'Preenchimento',
};

const equipesStore = useEquipesStore();

const equipes = computed(() => (equipesStore.lista as EquipeRespItemDto[])
  .filter((item) => {
    switch (route.query.aba) {
      case 'Preenchimento':
        return item.perfil === 'Medicao';

      case 'Validacao':
        return item.perfil === 'Validacao';

      case 'Liberacao':
        return item.perfil === 'Liberacao';

      default:
        return true;
    }
  }));

const campos = computed<FieldsProps[]>(() => [
  { class: 'fg999', nome: 'codigo', tipo: 'text' },
  { class: 'fb25', nome: 'palavra_chave', tipo: 'text' },
  {
    class: 'fb25', nome: 'equipe_id', tipo: 'select', opcoes: equipes.value,
  },
  {
    class: 'fb25', nome: 'referencia', tipo: 'text', mask: maskMonth, placeholder: '01/2024',
  },
]);

const { handleSubmit, isSubmitting, setValues } = useForm({
  validationSchema: schema,
  initialValues: route.query,
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  const parametros = Object.keys(valoresControlados).reduce((amount, item) => {
    amount[item] = valoresControlados[item] ? String(valoresControlados[item]) : undefined;
    return amount;
  }, {} as Record<string, string | undefined>);

  router.replace({
    query: {
      ...route.query,
      ...parametros,
    },
  });
});

watch(() => route.query, (val) => {
  setValues(val);
}, { deep: true });
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
              :placeholder="campo.placeholder"
              :maxlength="campo.mask && 7"
              @keyup="campo.mask"
            />
            <Field
              v-else
              class="inputtext light mb1"
              :name="campo.nome"
              as="select"
            >
              <option value="">
                -
              </option>

              <option
                v-for="opcao in campo.opcoes"
                :key="`ciclo-atualizacao-equipe--${opcao.id}`"
                :value="opcao.id"
              >
                {{ opcao.orgao.sigla }} - {{ opcao.titulo }}
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
