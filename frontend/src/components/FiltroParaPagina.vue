<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Field, useForm, ErrorMessage, useIsFormDirty,
} from 'vee-validate';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import AutocompleteField2 from './AutocompleteField2.vue';

defineOptions({ inheritAttrs: false });

type OpcaoPadronizada = {
  id: number | string
  label: string
};

type Opcoes = OpcaoPadronizada[] | string[] | number[];

type CampoFiltro = {
  class?: string
  tipo: 'select' | 'text' | 'search' | 'date' | 'checkbox' | 'autocomplete'
  opcoes?: Opcoes
  autocomplete?: {
    label?: string
    apenasUm?: boolean
  }
};
type Campos = Record<string, CampoFiltro>;

type Linha = {
  class?: string,
  campos: Campos,
  decorador?: 'esquerda' | 'direita'
};
export type Formulario = Linha[];

type Props = {
  formulario: Linha[]
  schema: Record<string, any>
  valoresIniciais?: Record<string, any>
  autoSubmit?: boolean
  class?: string
};
type Emits = {
  'update:formularioSujo': [boolean]
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const route = useRoute();
const router = useRouter();

const {
  handleSubmit, isSubmitting, resetForm, setValues, meta,
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

if (props.autoSubmit) {
  watch(() => meta.value.dirty, () => {
    if (meta.value.dirty) {
      onSubmit();
    }
  });
}
</script>

<template>
  <div
    class="comunicados-gerais-filtro"
    :class="$props.class"
  >
    <FormularioQueryString :valores-iniciais="valoresIniciais">
      <form @submit="onSubmit">
        <div
          v-for="(linha, linhaIndex) in formulario"
          :key="`linha--${linhaIndex}`"
          class="flex center g2 flexwrap"
          :class="linha.decorador === 'direita' && 'row-reverse'"
        >
          <hr
            v-if="linha.decorador"
            class="f1"
          >

          <div
            class="flex g2"
            :class="linha.class || 'fg999'"
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
                v-else-if="campo.tipo === 'autocomplete'"
                v-slot="{ value, handleChange }"
                class="inputtext light mb1"
                :name="campoNome"
              >
                <AutocompleteField2
                  class="f1 mb1"
                  :controlador="{ participantes: value, busca: '' }"
                  :grupo="campo.opcoes"
                  :label="campo.autocomplete?.label || 'label'"
                  :apenas-um="campo.autocomplete?.apenasUm"
                  @change="ev => handleChange(ev)"
                />
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

        <div
          v-if="!autoSubmit"
          class="flex justifyright"
        >
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
