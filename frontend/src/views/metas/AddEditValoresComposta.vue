<script setup>
import auxiliarDePreenchimento from '@/components/AuxiliarDePreenchimento.vue';
import dateToTitle from '@/helpers/dateToTitle';
import geradorDeAtributoStep from '@/helpers/geradorDeAtributoStep';
import { useAlertStore } from '@/stores/alert.store';
import { useVariaveisStore } from '@/stores/variaveis.store';
import { cloneDeep } from 'lodash';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  FieldArray,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import {
  computed, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';

const alertStore = useAlertStore();

const route = useRoute();

const { var_id: varId } = route.params;

const VariaveisStore = useVariaveisStore();
const {
  PeríodosAbrangidosPorVariável,
  sériesDeCompostaParaEdição,
  sériesDaVariávelComposta,
} = storeToRefs(VariaveisStore);

const tipoDeValor = computed(() => {
  switch (route.meta.tipoDeValor) {
    case 'Previsto':
    case 'previsto':
      return 'Previsto';

    case 'Realizado':
    case 'realizado':
      return 'Realizado';

    default:
      throw new Error(`\`tipoDeValor\` inválido para essa rota: \`${route.meta.tipoDeValor}\`. Deveria ser \`previsto\` ou \`realizado\`.`);
  }
});

const período = ref('');

const modoDePreenchimento = ref('valor_nominal'); // ou `valor_acumulado`
const valorPadrão = ref(0);

// eslint-disable-next-line max-len
const valoresIniciais = computed(() => ({ valores: sériesDeCompostaParaEdição.value[tipoDeValor.value] }));

const {
  errors, handleSubmit, isSubmitting, resetField, resetForm, setFieldValue, values: carga,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: null,
});

const formularioSujo = useIsFormDirty();

const acumulados = computed(() => (Array.isArray(carga.valores)
  ? carga.valores.map((x, i) => ({
    referencia: sériesDeCompostaParaEdição.value[`${tipoDeValor.value}Acumulado`][i].referencia,
    valor: Number.parseFloat(x.valor || 0) + sériesDeCompostaParaEdição.value[`Diferença${tipoDeValor.value}`][i],
  }))
  : []));

const soma = computed(() => ({
  fornecidos: carga.valores.reduce((acc, cur) => acc + Number(cur.valor), 0),
  acumulados: acumulados.value?.reduce((acc, cur) => acc + Number(cur.valor), 0) || 0,
}));

const atualizarAPartirDoAcumulado = ((valorFornecido, índice) => {
  const diferença = sériesDeCompostaParaEdição.value?.[`Diferença${tipoDeValor.value}`][índice];
  const novoAcumulado = typeof valorFornecido === 'number'
    ? valorFornecido
    : Number.parseFloat(valorFornecido.replace(/\D/, ''))
    || 0;

  setFieldValue(`valores[${índice}].valor`, novoAcumulado - diferença);
});

const onSubmit = handleSubmit.withControlled(async () => {
  try {
    const msg = 'Valores salvos!';
    const r = await VariaveisStore.updateValores(carga);

    if (r) {
      alertStore.success(msg);
      resetForm({ values: cloneDeep(carga) });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function preencherVaziosCom() {
  carga.valores.forEach((x, i) => {
    if (!x.valor && x.valor !== 0) {
      switch (modoDePreenchimento.value) {
        case 'valor_nominal':
          setFieldValue(`valores[${i}].valor`, valorPadrão.value);
          break;
        case 'valor_acumulado':
          atualizarAPartirDoAcumulado(valorPadrão.value, i);
          break;

        default:
          throw new Error(`\`modoDePreenchimento\` inválido: \`${modoDePreenchimento.value}\`. Deveria ser \`valor_nominal\` ou \`valor_acumulado\`.`);
      }
    }
  });
}

function limparFormulário() {
  carga.valores.forEach((_x, i) => {
    resetField(`valores[${i}].valor`, { value: undefined });
  });
}

function atualizarPeríodo(evento) {
  const { value: valor } = evento.target;

  if (formularioSujo.value) {
    alertStore.confirmAction('Deseja sair sem salvar as alterações?', () => {
      período.value = valor;
    }, 'OK', () => {
      // eslint-disable-next-line no-param-reassign
      evento.target.value = período.value;
      alertStore.clear();
    });
  } else {
    período.value = valor;
  }
}

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
    <CheckClose :formulario-sujo="formularioSujo" />
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
          class="inputtext light"
          @change="($event) => atualizarPeríodo($event)"
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

          <button
            type="reset"
            class="f0 mb1 pl0 pr0 btn bgnone"
            @click.prevent="resetForm"
          >
            &excl; restaurar
          </button>
        </div>

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
            <colgroup>
              <col>
              <col>
              <col>
            </colgroup>

            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>
                  Valor
                </th>
                <th>
                  Valor acumulado
                </th>
              </tr>
            </thead>
            <tfoot>
              <tr>
                <th />
                <th />
                <th>
                  {{ soma.fornecidos }}
                </th>
                <th>
                  {{ soma.acumulados }}
                </th>
              </tr>
            </tfoot>
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
                    class="inputtext light"
                    :class="{ 'error': errors[`valores[${idx}].valor`] }"
                    :disabled="modoDePreenchimento !== 'valor_nominal'"
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
                    class="inputtext light"
                    :disabled="modoDePreenchimento !== 'valor_acumulado'"
                    @input="($event) => { atualizarAPartirDoAcumulado($event.target.value, idx) }"
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
