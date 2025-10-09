<script setup lang="ts">
import {
  computed,
  nextTick,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import AutocompleteField2 from './AutocompleteField2.vue';

type OpcaoPadronizada = {
  id: number | string
  label: string
};

type Opcoes = OpcaoPadronizada[] | string[] | number[];

type CampoFiltro = {
  class?: string
  tipo: 'select' | 'text' | 'search' | 'date' | 'checkbox' | 'autocomplete' | 'numeric'
  opcoes?: Opcoes
  autocomplete?: {
    label?: string
    apenasUm?: boolean
  },
  atributos?: Record<string, unknown>
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
  schema: Record<string, unknown>
  modelValue?: Record<string, unknown>
  valoresIniciais?: Record<string, unknown>
  autoSubmit?: boolean
  carregando?: boolean
  bloqueado?: boolean
  naoEmitirQuery?: boolean
  umaLinha?: boolean
};
type Emits = {
  (e: 'update:formularioSujo', value: boolean): void
  (e: 'update:modelValue', value: Record<string, unknown>): void
  (e: 'filtro'): void
};

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  valoresIniciais: undefined,
});
const emit = defineEmits<Emits>();

const route = useRoute();
const router = useRouter();

const {
  errors, handleSubmit, isSubmitting, resetForm, setValues, meta, values,
} = useForm({
  validationSchema: props.schema,
  initialValues: route.query,
});

const formularioSujo = useIsFormDirty();

const idsDasMensagensDeErro = computed(() => Object.keys(errors.value).reduce((acc, key) => `${acc}err__${key} `, ''));

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

  if (!props.naoEmitirQuery) {
    router.replace({
      query: queryFiltrada,
    });
  }

  emit('filtro');
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

watch(values, () => {
  emit('update:modelValue', values);
});

watch(() => props.modelValue, async (val) => {
  if (!val) return;

  const valoresLocais = { ...val } as any;

  setValues(valoresLocais);
  await nextTick();

  resetForm({ values: valoresLocais });
});

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
    class="filtro-para-pagina"
    :class="formularioSujo ? 'filtro-sujo' : ''"
  >
    <FormularioQueryString
      v-slot="{
        pendente,
      }"
      :valores-iniciais="valoresIniciais"
    >
      <form
        :aria-busy="pendente"
        :class="{ 'flex g1 center': $props.umaLinha }"
        @submit.prevent="!carregando && !pendente && onSubmit()"
      >
        <div class="f1">
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
              class="flex g2 flexwrap"
              :class="linha.class || 'fg999'"
            >
              <div
                v-for="(campo, campoNome) in linha.campos"
                :key="campoNome"
                :class="['f1 align-end', campo.class]"
              >
                <LabelFromYup
                  :name="campoNome"
                  :schema="schema"
                  class="tc300"
                />

                <Field
                  v-if="campo.tipo === 'checkbox'"
                  v-slot="{ field: { value }, handleInput }"
                  :name="campoNome"
                  :disabled="$props.bloqueado"
                  :aria-busy="$props.carregando"
                  :aria-invalid="!!errors[campoNome]"
                  :aria-errormessage="errors[campoNome] ? `err__${campoNome}` : undefined"
                >
                  <div
                    class="flex itemscenter"
                    style="height: 41px"
                  >
                    <input
                      type="checkbox"
                      class="interruptor"
                      :checked="value"
                      :disabled="$props.bloqueado"
                      :aria-busy="$props.carregando"
                      @input="(ev) => handleInput(ev.target.checked)"
                    >
                  </div>
                </Field>

                <Field
                  v-else-if="campo.tipo === 'select'"
                  class="inputtext light mb1"
                  :name="campoNome"
                  as="select"
                  :disabled="$props.bloqueado"
                  :aria-busy="$props.carregando"
                  :aria-invalid="!!errors[campoNome]"
                  :aria-errormessage="errors[campoNome] ? `err__${campoNome}` : undefined"
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
                  :aria-invalid="!!errors[campoNome]"
                  :aria-errormessage="errors[campoNome] ? `err__${campoNome}` : undefined"
                >
                  <AutocompleteField2
                    class="f1 mb1"
                    :controlador="{ participantes: value, busca: '' }"
                    :grupo="campo.opcoes"
                    :label="campo.autocomplete?.label || 'label'"
                    :apenas-um="campo.autocomplete?.apenasUm"
                    :readonly="$props.carregando"
                    @change="ev => handleChange(ev)"
                  />
                </Field>

                <Field
                  v-else-if="campo.tipo === 'numeric'"
                  class="inputtext light mb1"
                  :name="campoNome"
                  type="text"
                  :disabled="$props.bloqueado"
                  :aria-busy="$props.carregando"
                  :aria-invalid="!!errors[campoNome]"
                  :aria-errormessage="errors[campoNome] ? `err__${campoNome}` : undefined"
                  inputmode="numeric"
                  v-bind="campo.atributos"
                />

                <Field
                  v-else
                  class="inputtext light mb1"
                  :name="campoNome"
                  :type="campo.tipo"
                  :disabled="$props.bloqueado"
                  :aria-busy="$props.carregando"
                  :aria-invalid="!!errors[campoNome]"
                  :aria-errormessage="errors[campoNome] ? `err__${campoNome}` : undefined"
                />

                <ErrorMessage
                  :id="`err__${campoNome}`"
                  class="error-msg mb1"
                  :name="campoNome"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="!autoSubmit"
          class="flex justifyright"
        >
          <button
            type="submit"
            class="btn outline bgnone tcprimary"
            :class="[{ loading: carregando }, {'mtauto mb1': !$props.umaLinha}]"
            :aria-busy="isSubmitting || carregando"
            :aria-disabled="!!Object.keys(errors)?.length"
            :aria-invalid="!!Object.keys(errors)?.length"
            :aria-errormessage="idsDasMensagensDeErro"
          >
            Pesquisar
          </button>
        </div>
      </form>
    </FormularioQueryString>
  </div>
</template>
