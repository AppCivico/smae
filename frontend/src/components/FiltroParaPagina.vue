<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Field, useForm, ErrorMessage, useIsFormDirty,
} from 'vee-validate';

import LabelFromYup from '@/components/LabelFromYup.vue';
import FormularioQueryString from '@/components/FormularioQueryString.vue';

defineOptions({ inheritAttrs: false });

type OpcaoPadronizada = {
  id: number | string
  label: string
};

type Opcoes = OpcaoPadronizada[] | string[] | number[];

type CampoFiltro = {
  class?: string
  tipo: 'select' | 'text' | 'search' | 'date' | 'checkbox'
  opcoes?: Opcoes
};
type Campos = Record<string, CampoFiltro>;

type Linha = {
  class?: string,
  campos: Campos
};
export type Formulario = Linha[];

type Props = {
  formulario: Linha[]
  schema: Record<string, any>
  valoresIniciais?: Record<string, any>
};
type Emits = {
  'update:formularioSujo': [boolean]
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const route = useRoute();
const router = useRouter();

const {
  handleSubmit, isSubmitting, resetForm, setValues,
} = useForm({
  validationSchema: props.schema,
  initialValues: route.query,
});

const formularioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  const query = {
    ...route.query,
    ...valoresControlados,
  };

  if (query.pagina) {
    delete query.pagina;
    delete query.token_paginacao;
  }

  const queryFiltrada = Object.keys(query).reduce((amount, item) => {
    const value = query[item];

    if (value === undefined || value === '') {
      return amount;
    }

    return {
      ...amount,
      [item]: value,
    };
  }, {});

  router.replace({
    query: queryFiltrada,
  });
});

function padronizarOpcoes(opcoes: Opcoes): OpcaoPadronizada[] {
  return opcoes.map<OpcaoPadronizada>((item) => {
    if (typeof item === 'string' || typeof item === 'number') {
      return { id: item, label: item.toString() };
    }

    return { id: item.id, label: item.label };
  });
}

watch(formularioSujo, () => {
  emit('update:formularioSujo', formularioSujo.value);
});

watch(() => route.query, () => {
  setValues(route.query);

  nextTick(() => {
    resetForm({ values: route.query });
  });
}, { deep: true, immediate: true });
</script>

<template>
  <div class="comunicados-gerais-filtro">
    <FormularioQueryString :valores-iniciais="valoresIniciais">
      <form @submit="onSubmit">
        <div
          v-for="(linha, linhaIndex) in formulario"
          :key="`linha--${linhaIndex}`"
          class="flex center g2"
        >
          <div
            class="flex g2 fg999"
            :class="linha.class"
          >
            <div
              v-for="(campo, campoNome) in linha.campos"
              :key="campoNome"
              :class="['f1', campo.class]"
            >
              <LabelFromYup
                :name="campoNome"
                :schema="schema"
              />

              <Field
                v-if="campo.tipo === 'checkbox'"
                v-slot="{ field: { value }, handleInput }"
                :name="campoNome"
              >
                <div
                  class="flex itemscenter"
                  style="height: 41px"
                >
                  <input
                    type="checkbox"
                    class="interruptor"
                    :checked="value"
                    @input="(ev) => handleInput(ev.target.checked)"
                  >
                </div>
              </Field>

              <Field
                v-else-if="campo.tipo === 'select'"
                class="inputtext light mb1"
                :name="campoNome"
                as="select"
              >
                <option :value="null">
                  -
                </option>
                <template v-if="campo.opcoes?.length">
                  <option
                    v-for="opcao in padronizarOpcoes(campo.opcoes)"
                    :key="`comunicado-tipo--${campoNome}-${opcao.id}`"
                    :value="opcao.id"
                  >
                    {{ opcao.label }}
                  </option>
                </template>
              </Field>

              <Field
                v-else
                class="inputtext light mb1"
                :name="campoNome"
                :type="campo.tipo"
              />

              <ErrorMessage
                class="error-msg mb1"
                :name="campoNome"
              />
            </div>
          </div>
        </div>

        <div class="flex justifyright">
          <button
            type="submit"
            class="btn"
            :disabled="isSubmitting"
          >
            Filtrar
          </button>
        </div>
      </form>
    </FormularioQueryString>
  </div>
</template>
