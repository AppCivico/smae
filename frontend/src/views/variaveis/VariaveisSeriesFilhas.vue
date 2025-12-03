<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, FieldArray, useForm, useIsFormDirty,
} from 'vee-validate';
import {
  computed, defineEmits, defineProps, onUnmounted, ref, watch,
} from 'vue';

import auxiliarDePreenchimento from '@/components/AuxiliarDePreenchimento.vue';
import CheckClose from '@/components/CheckClose.vue';
import ErrorComponent from '@/components/ErrorComponent.vue';
import dateToTitle from '@/helpers/dateToTitle';
import geradorDeAtributoStep from '@/helpers/geradorDeAtributoStep';
import nulificadorTotal from '@/helpers/nulificadorTotal';
import { useAlertStore } from '@/stores/alert.store';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store';

import { useSeriesFilhasAgrupadasParaEdicao } from './useSeriesAgrupadasParaEdicao.composable';

const alertStore = useAlertStore();

const variaveisGlobaisStore = useVariaveisGlobaisStore();

const props = defineProps({
  variavelId: {
    type: [
      Number,
      String,
    ],
    required: true,
  },
  tipoDeValor: {
    type: String,
    required: true,
    validator: (value) => ['Previsto', 'Realizado'].includes(value as string),
  },
});

const emit = defineEmits(['close']);

const {
  dadosDosPeriodosValidos,
  seriesAgrupadas,
  chamadasPendentes,
  erros,
} = storeToRefs(variaveisGlobaisStore);

const { seriesFilhas } = useSeriesFilhasAgrupadasParaEdicao(seriesAgrupadas);

const modoDePreenchimento = ref('valor_nominal'); // ou `valor_acumulado`
const valorPadrao = ref<number | ''>(0);
const periodoSelecionado = ref<string>('');
const mapaDeAcumulados = ref<Record<number, number>>({});

// Desabilitado por enquanto
// const ehAcumulativa = computed(() => seriesAgrupadas.value?.variavel?.acumulativa);
const ehAcumulativa = false;

const ehCategorica = computed(() => !!seriesAgrupadas.value?.dados_auxiliares?.categoricas);
// eslint-disable-next-line max-len
const opcoesCategoricas = computed(() => seriesAgrupadas.value?.dados_auxiliares?.categoricas
  || {});

const valoresIniciais = computed(() => ({
  valores: seriesFilhas.value?.[props.tipoDeValor] || [],
}));

const {
  errors,
  handleSubmit,
  isSubmitting,
  setFieldValue,
  resetForm,
  controlledValues: cargaControlada,
} = useForm({
  initialValues: valoresIniciais.value,
});

const formularioSujo = useIsFormDirty();

const soma = computed(() => ({
  fornecidos: cargaControlada?.value?.valores?.reduce(
    (acc, cur) => acc
  + (Number(cur.valor) || 0),
    0,
  ),
  // TODO: calcular corretamente o acumulado
  acumulados: 0,
}));

const onSubmit = handleSubmit(async () => {
  try {
    const msg = 'Valores salvos!';
    const r = await variaveisGlobaisStore.salvarSeries(nulificadorTotal(cargaControlada.value));

    if (r) {
      alertStore.success(msg);
      emit('close');
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function preencherVaziosCom(valor: number | string) {
  if (!Array.isArray(cargaControlada.value?.valores)) {
    return;
  }

  cargaControlada.value.valores.forEach((serie, i: number) => {
    if (!serie.valor && serie.valor !== 0) {
      switch (modoDePreenchimento.value) {
        case 'valor_nominal':
          setFieldValue(`valores[${i}].valor`, valor);
          break;

        case 'valor_acumulado':
          throw new Error('O preenchimento de vazios não faz sentido para `valor_acumulado`');

        default:
          throw new Error(`\`modoDePreenchimento\` inválido: \`${modoDePreenchimento.value}\`. Deveria ser \`valor_nominal\` ou \`valor_acumulado\`.`);
      }
    }
  });
}

function limparFormulario() {
  if (!Array.isArray(cargaControlada.value?.valores)) {
    return;
  }

  cargaControlada.value.valores.forEach((_serie, i: number) => {
    setFieldValue(`valores[${i}].valor`, null);
  });
}

function atualizarAPartirDoAcumulado(value: string, idx: number) {
  // TODO: implement accumulated value logic
  console.warn('atualizarAPartirDoAcumulado not yet implemented', value, idx);
}

watch(() => props.variavelId, (novoId) => {
  dadosDosPeriodosValidos.value = null;
  periodoSelecionado.value = '';

  variaveisGlobaisStore
    .buscarPeriodosValidos(novoId, { ate_ciclo_corrente: true })
    .then(() => {
      if (dadosDosPeriodosValidos.value?.ultimo_periodo_valido) {
        periodoSelecionado.value = dadosDosPeriodosValidos.value.ultimo_periodo_valido;
      }
    });
}, {
  immediate: true,
});

watch(periodoSelecionado, (novoPeriodo) => {
  seriesAgrupadas.value = null;

  if (novoPeriodo === '') {
    return;
  }

  variaveisGlobaisStore.buscarSerie(props.variavelId, {
    incluir_auxiliares: true,
    retornar_filhas: true,
    data_valor: novoPeriodo,
    serie: props.tipoDeValor,
  });
});

watch(valoresIniciais, (novoValor) => {
  modoDePreenchimento.value = 'valor_nominal';

  resetForm({
    values: novoValor,
  });
}, {
  immediate: true,
});

onUnmounted(() => {
  seriesAgrupadas.value = null;
  dadosDosPeriodosValidos.value = null;
});
</script>
<template>
  <header class="flex g2 spacebetween center mb2">
    <h2>Edição retroativa</h2>

    <hr class="f1">

    <CheckClose
      :formulario-sujo="formularioSujo"
      :apenas-emitir="true"
      @close="emit('close')"
    />
  </header>

  <TituloDePagina
    :prefixo="`Edição de valores ${tipoDeValor.toLowerCase()} para`"
    as="h3"
    icone="#i_indicador"
  >
    <template #icone>
      <svg
        color="#F2890D"
        width="32"
        height="32"
      ><use
        xlink:href="#i_indicador"
      /></svg>
    </template>
    <span>
      <strong>{{ seriesAgrupadas?.variavel?.codigo }}</strong>
      - {{ seriesAgrupadas?.variavel?.titulo }}
    </span>
  </TituloDePagina>

  <ErrorComponent
    v-if="erros.dadosDosPeriodosValidos"
    :erro="erros.dadosDosPeriodosValidos"
    class="mb2"
  />

  <div class="flex center g1 mb1">
    <SmaeLabel
      for="periodo"
      class="mb0"
    >
      Período
    </SmaeLabel>

    <div class="f2 mr1">
      <select
        id="periodo"
        v-model="periodoSelecionado"
        class="inputtext light"
        :aria-busy="chamadasPendentes.dadosDosPeriodosValidos"
      >
        <option value="" />
        <option
          v-for="item in dadosDosPeriodosValidos?.periodos_validos"
          :key="item"
          :value="item"
        >
          {{ dateToTitle(item) }}
        </option>
      </select>
    </div>
  </div>

  <template v-if="periodoSelecionado">
    <LoadingComponent v-if="chamadasPendentes.seriesAgrupadas" />

    <ErrorComponent
      v-if="erros.seriesAgrupadas"
      :erro="erros.seriesAgrupadas"
      class="mb2"
    />

    <template v-if="seriesAgrupadas">
      <auxiliarDePreenchimento>
        <div class="flex g2 end mb1">
          <div class="f1">
            <label
              class="label"
              for="valor-a-aplicar"
            >Valor a aplicar</label>
            <input
              v-if="!ehCategorica"
              id="valor-a-aplicar"
              v-model="valorPadrao"
              type="number"
              class="inputtext light mb1"
            >

            <select
              v-else
              id="valor-a-aplicar"
              v-model="valorPadrao"
              class="inputtext light mb1"
            >
              <option value="">
                -
              </option>

              <option
                v-for="(valor, chave) in opcoesCategoricas"
                :key="chave"
                :value="chave"
              >
                {{ valor }}
              </option>
            </select>
          </div>
          <button
            type="button"
            class="f0 mb1 btn bgnone outline tcprimary"
            :disabled="valorPadrao === '' || modoDePreenchimento !== 'valor_nominal'"
            @click="preencherVaziosCom(valorPadrao)"
          >
            Preencher vazios
          </button>

          <button
            type="reset"
            form="form"
            class="f0 mb1 pl0 pr0 btn bgnone"
            @click="limparFormulario"
          >
            &times; limpar tudo
          </button>

          <button
            type="reset"
            class="f0 mb1 pl0 pr0 btn bgnone"
            @click.prevent="resetForm()"
          >
            &excl; restaurar
          </button>
        </div>

        <template v-if="ehAcumulativa">
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
        </template>
      </auxiliarDePreenchimento>

      <hr class="mb2 f1">

      <form
        id="form"
        @submit="onSubmit"
      >
        <FieldArray
          v-slot="{ fields }"
          name="valores"
        >
          <table
            v-if="fields?.length"
            class="tablemain no-zebra mb1 fix"
          >
            <colgroup>
              <col>
              <col style="width: 25%">
              <col
                v-if="ehAcumulativa"
                style="width: 25%"
              >
            </colgroup>

            <thead>
              <tr>
                <th scope="col">
                  Variável filha
                </th>
                <th
                  scope="col"
                  :class="{
                    'cell--number': !ehCategorica
                  }"
                >
                  Valor
                </th>
                <th
                  v-if="ehAcumulativa"
                  scope="col"
                  :class="{
                    'cell--number': !ehCategorica
                  }"
                >
                  Valor acumulado
                </th>
              </tr>
            </thead>
            <tfoot v-if="!ehCategorica">
              <tr>
                <th scope="col" />
                <th
                  scope="col"
                  :class="{
                    'cell--number': !ehCategorica
                  }"
                >
                  <output>{{ soma.fornecidos }}</output>
                </th>
                <th
                  v-if="ehAcumulativa"
                  scope="col"
                  :class="{
                    'cell--number': !ehCategorica
                  }"
                >
                  <output>{{ soma.acumulados }}</output>
                </th>
              </tr>
            </tfoot>
            <tr
              v-for="(field, idx) in fields"
              :key="idx"
            >
              <th scope="row">
                <span class="tc600 w400 nc">
                  <strong class="block">
                    {{ field?.value.variavel.codigo || '-' }}
                  </strong>

                  {{ field?.value.variavel.titulo || '-' }}
                </span>
                <Field
                  :name="`valores[${idx}].referencia`"
                  :value="field.value.referencia"
                  type="hidden"
                />
              </th>
              <td class="tr">
                <Field
                  v-if="!ehCategorica"
                  :name="`valores[${idx}].valor`"
                  type="number"
                  :value="field.value.valor"
                  :step="geradorDeAtributoStep(
                    field?.value.variavel.casas_decimais
                  )"
                  class="inputtext light tr"
                  :class="{ 'error': errors[`valores[${idx}].valor` as keyof typeof errors] }"
                  :disabled="modoDePreenchimento !== 'valor_nominal'"
                />

                <Field
                  v-else
                  class="inputtext light"
                  :class="{ 'error': errors[`valores[${idx}].valor` as keyof typeof errors] }"
                  as="select"
                  :name="`valores[${idx}].valor`"
                >
                  <option value="">
                    -
                  </option>

                  <option
                    v-for="(valor, chave) in opcoesCategoricas"
                    :key="chave"
                    :value="chave"
                  >
                    {{ valor }}
                  </option>
                </Field>

                <ErrorMessage
                  class="error-msg mt1"
                  :name="`valores[${idx}].valor`"
                />
              </td>
              <td
                v-if="ehAcumulativa"
                class="tr"
              >
                <input
                  v-if="field?.value.variavel.acumulativa"
                  v-model="mapaDeAcumulados[idx]"
                  type="number"
                  class="inputtext light tr"
                  :step="geradorDeAtributoStep(
                    field?.value.variavel.casas_decimais
                  )"
                  :disabled="modoDePreenchimento !== 'valor_acumulado'"
                  @input="($event) => { atualizarAPartirDoAcumulado($event.target.value, idx) }"
                >
                <template v-else>
                  -
                </template>
              </td>
            </tr>
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

    <div v-else>
      <p class="w600 t18 tc">
        Não há séries disponíveis
      </p>
    </div>
  </template>
</template>
