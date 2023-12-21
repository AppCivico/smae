<script setup>
// import auxiliarDePreenchimento from '@/components/AuxiliarDePreenchimento.vue';
import dateToTitle from '@/helpers/dateToTitle';
import sentenceCase from '@/helpers/sentenceCase';
import geradorDeAtributoStep from '@/helpers/geradorDeAtributoStep';
import { useAlertStore } from '@/stores/alert.store';
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

const alertStore = useAlertStore();

const route = useRoute();

const { var_id: varId } = route.params;

const VariaveisStore = useVariaveisStore();
const {
  PeríodosAbrangidosPorVariável,
  sériesDeCompostaParaEdição,
  sériesDaVariávelComposta,
} = storeToRefs(VariaveisStore);

const tipoDeValor = computed(() => (route.meta.tipoDeValor
  ? sentenceCase(route.meta.tipoDeValor)
  : 'Previsto'));

const período = ref('');

const modoDePreenchimento = ref('valor_nominal'); // ou `valor_acumulado`
// const valorPadrão = ref(0);

const valoresIniciais = computed(() => {
  switch (tipoDeValor.value) {
    case 'Previsto':
    case 'Realizado':
      return { valores: sériesDeCompostaParaEdição.value[tipoDeValor.value] };
    default:
      throw new Error(`\`tipoDeValor\` inválido para essa rota: \`${tipoDeValor.value}\`. Deveria ser: \`previsto\` ou \`realizado\`.`);
  }
});

const {
  errors, handleSubmit, isSubmitting, resetField, resetForm, setFieldValue, values: carga,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: null,
});

const formulárioSujo = useIsFormDirty();

const acumulados = ref([]);

const atualizarAPartirDoAcumulado = ((valorFornecido, índice) => {
  const diferença = sériesDeCompostaParaEdição.value?.[`Diferença${tipoDeValor.value}`][índice];
  const novoAcumulado = Number.parseFloat(valorFornecido.replace(/\D/, '')) || 0;

  setFieldValue(`valores[${índice}].valor`, novoAcumulado - diferença);
});

const atualizarAPartirDoValorPuro = ((valorFornecido, índice) => {
  const diferença = sériesDeCompostaParaEdição.value?.[`Diferença${tipoDeValor.value}`][índice];
  const novoPuro = Number.parseFloat(valorFornecido.replace(/\D/, '')) || 0;

  acumulados.value[índice].valor = novoPuro + diferença;
});

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    const msg = 'Valores salvos!';
    const r = await VariaveisStore.updateValores(carga);

    if (r) {
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
});

// function preencherVaziosCom() {
//   // sobral, mudar isso de acordo com o tipoDeValor
//   carga.valores.forEach((x, i) => {
//     if (x.valor === undefined || x.valor === '') {
//       setFieldValue(`valores[${i}].valor`, valorPadrão.value);
//     }
//   });
// }

// function limparFormulário() {
//   carga.valores.forEach((_x, i) => {
//     resetField(`valores[${i}].valor`, { value: undefined });
//   });
// }

VariaveisStore.buscarPeríodosDeVariávelDeFórmula(varId);

watch(valoresIniciais, (novoValor) => {
  resetForm({ values: novoValor });
}, { immediate: true });

watch(sériesDeCompostaParaEdição, (novoValor) => {
  if (Array.isArray(novoValor?.[`${tipoDeValor.value}Acumulado`])) {
    acumulados.value = [...novoValor[`${tipoDeValor.value}Acumulado`]];
  }
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
      Valores e acumulados para cada variável <span class="tvermelho">*</span>
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
      <!--
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
      -->

      <hr class="mb2 f1">

      <div class="flex mb2">
        <label class="f1">
          <input
            v-model="modoDePreenchimento"
            type="radio"
            class="inputcheckbox"
            value="valor_nominal"
          ><span>Preencher por valor nominal</span></label>
        <label class="f1">
          <input
            v-model="modoDePreenchimento"
            type="radio"
            class="inputcheckbox"
            value="valor_acumulado"
          ><span>Preencher por valor acumulado</span></label>
      </div>

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
                Valor
              </th>
              <th>
                Valor acumulado
              </th>
            </thead>
            <template
              v-for="(field, idx) in fields"
              :key="idx"
            >
              <tr
                :hidden="modoDePreenchimento === 'valor_acumulado'
                  && !sériesDaVariávelComposta.linhas?.[idx]?.variavel?.acumulativa"
              >
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
                    :disabled="modoDePreenchimento !== 'valor_nominal'"
                    @input="($event) => {
                      atualizarAPartirDoValorPuro($event.target.value, idx)
                    }"
                  />
                  <ErrorMessage
                    class="error-msg mt1"
                    :name="`valores[${idx}].valor`"
                  />
                </td>
                <td>
                  <input
                    v-if="sériesDaVariávelComposta.linhas?.[idx]?.variavel?.acumulativa"
                    type="number"
                    :value="acumulados[idx].valor"
                    :step="geradorDeAtributoStep(
                      sériesDaVariávelComposta.linhas?.[idx]?.variavel?.casas_decimais
                    )"
                    min="0"
                    class="inputtext light"
                    :disabled="modoDePreenchimento !== 'valor_acumulado'"
                    @input="($event) => {
                      acumulados[idx].valor = $event.target.value;
                      atualizarAPartirDoAcumulado($event.target.value, idx);
                    }"
                  >
                  <template v-else>
                    -
                  </template>
                </td>
              </tr>
            </template>
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
