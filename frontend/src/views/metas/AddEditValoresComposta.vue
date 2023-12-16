<script setup>
import auxiliarDePreenchimento from '@/components/AuxiliarDePreenchimento.vue';
import dateToTitle from '@/helpers/dateToTitle';
import geradorDeAtributoStep from '@/helpers/geradorDeAtributoStep';
import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { useVariaveisStore } from '@/stores/variaveis.store';
import { storeToRefs } from 'pinia';
import {
  computed, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';
import {
  Field,
  FieldArray,
  ErrorMessage,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import CheckClose from '@/components/CheckClose.vue';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const route = useRoute();

const { var_id: varId } = route.params;

const VariaveisStore = useVariaveisStore();
const {
  PeríodosAbrangidosPorVariável,
  sériesDeCompostaParaEdição,
  sériesDaVariávelComposta,
} = storeToRefs(VariaveisStore);

const período = ref('');
const valorPadrão = ref(0);

const valoresIniciais = computed(() => {
  switch (route.meta.tipoDeValor) {
    case 'previsto':
      return { valores: sériesDeCompostaParaEdição.value.Previsto };
    case 'realizado':
      return { valores: sériesDeCompostaParaEdição.value.Realizado };
    default:
      throw new Error(`\`tipoDeValor\` inválido para essa rota: \`${route.meta.tipoDeValor}\`. Deveria ser: \`previsto\` ou \`realizado\`.`);
  }
});

const {
  errors, handleSubmit, isSubmitting, resetField, resetForm, setFieldValue, values: carga,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: null,
});

const formulárioSujo = useIsFormDirty();
const onSubmit = handleSubmit.withControlled(async () => {
  try {
    const msg = 'Valores salvos!';
    const r = await VariaveisStore.updateValores(carga);

    if (r) {
      alertStore.success(msg);
      editModalStore.$reset();
      router.push({ name: route.meta.rotaDeEscape, params: route.params });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function preencherVaziosCom() {
  carga.valores.forEach((x, i) => {
    if (x.valor === undefined || x.valor === '') {
      setFieldValue(`valores[${i}].valor`, valorPadrão.value);
    }
  });
}

function limparFormulário() {
  carga.valores.forEach((_x, i) => {
    resetField(`valores[${i}].valor`, { value: undefined });
  });
}

VariaveisStore.buscarPeríodosDeVariávelDeFórmula(varId);

watch(valoresIniciais, (novoValor) => {
  resetForm(novoValor);
}, { immediate: true });

watch(período, (novoValor) => {
  VariaveisStore.buscarSériesDeVariávelDeFórmula(novoValor);
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h2>{{ route?.meta?.título }}</h2>
    <hr class="ml2 f1">
    <CheckClose :formulário-sujo="formulárioSujo" />
  </div>

  <template
    v-if="!(PeríodosAbrangidosPorVariável?.loading || PeríodosAbrangidosPorVariável?.error)
      && varId"
  >
    <div class="label mb2">
      Valores
      para cada variável <span class="tvermelho">*</span>
    </div>

    <div class="flex center g1 mb1">
      <div class="f1 label">
        Filtrar
      </div>

      <div class="f2 mr1">
        <select
          v-model="período"
          class="inputtext light"
        >
          <option value="" />
          <option
            v-for="item in PeríodosAbrangidosPorVariável"
            :key="item.dt"
            :value="item.dt"
          >
            {{ dateToTitle(item.dt) }}
          </option>
        </select>
      </div>
    </div>

    <template v-if="período">
      <auxiliarDePreenchimento>
        <div class="flex g2 end mb1">
          <div class="f1">
            <label class="label">Valor a aplicar</label>
            <input
              v-model="valorPadrão"
              type="number"
              min="0"
              class="inputtext light mb1"
            >
          </div>
          <button
            type="button"
            class="f0 mb1 btn bgnone outline tcprimary"
            :disabled="valorPadrão === ''"
            @click="preencherVaziosCom"
          >
            Preencher vazios
          </button>

          <button
            type="reset"
            form="form"
            class="f0 mb1 pl0 pr0 btn bgnone"
            @click="limparFormulário"
          >
            &times; limpar tudo
          </button>
        </div>
      </auxiliarDePreenchimento>

      <hr class="mb2 f1">

      <form
        v-if="!(sériesDaVariávelComposta?.loading || sériesDaVariávelComposta?.error)"
        id="form"
        @submit="onSubmit"
      >
        <FieldArray
          v-slot="{ fields }"
          name="valores"
        >
          <table
            v-if="fields.length"
            class="tablemain no-zebra mb1 fix"
          >
            <col>
            <col>
            <col>
            <thead>
              <th>Código</th>
              <th>Título</th>
              <th>
                Realizado
              </th>
            </thead>
            <tbody
              v-for="(field, idx) in fields"
              :key="idx"
            >
              <tr>
                <th>
                  {{ sériesDaVariávelComposta.linhas?.[idx]?.variavel?.codigo || '-' }}
                </th>
                <td>
                  {{ sériesDaVariávelComposta.linhas?.[idx]?.variavel?.titulo || '-' }}
                </td>
                <td>
                  <Field
                    :name="`valores[${idx}].referencia`"
                    :value="field.value.referencia"
                    type="hidden"
                  />
                  <Field
                    :name="`valores[${idx}].valor`"
                    type="number"
                    :value="field.value.valor"
                    :step="geradorDeAtributoStep(
                      sériesDaVariávelComposta.linhas?.[idx]?.variavel?.casas_decimais
                    )"
                    min="0"
                    class="inputtext light"
                    :class="{ 'error': errors[`valores[${idx}].valor`] }"
                  />
                  <ErrorMessage
                    class="error-msg mt1"
                    :name="`valores[${idx}].valor`"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </FieldArray>

        <div class="flex spacebetween center mb2 mt2">
          <hr class="mr2 f1">
          <button
            class="btn big"
            :disabled="isSubmitting"
          >
            Salvar
          </button>
          <hr class="ml2 f1">
        </div>
      </form>
    </template>
  </template>
  <template v-if="sériesDaVariávelComposta?.loading || PeríodosAbrangidosPorVariável?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="sériesDaVariávelComposta?.error || PeríodosAbrangidosPorVariável?.error">
    <div class="error p1">
      <div class="error-msg">
        {{ sériesDaVariávelComposta.error }}
      </div>
    </div>
  </template>
</template>
