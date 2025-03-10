<script setup lang="ts">
import {
  computed, defineEmits, defineProps, ref, watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import { Field, useForm, useIsFormDirty } from 'vee-validate';

import type { SerieIndicadorValorNominal, SerieValorNomimal } from '@/../../backend/src/variavel/entities/variavel.entity';
import CheckClose from '@/components/CheckClose.vue';
import ErrorComponent from '@/components/ErrorComponent.vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import auxiliarDePreenchimento from '@/components/AuxiliarDePreenchimento.vue';

import truncate from '@/helpers/texto/truncate';
import dateToTitle from '@/helpers/dateToTitle';
import nulificadorTotal from '@/helpers/nulificadorTotal';
import geradorDeAtributoStep from '@/helpers/geradorDeAtributoStep';

import { useAlertStore } from '@/stores/alert.store';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store';
import { useVariaveisCategoricasStore } from '@/stores/variaveisCategoricas.store';

type TiposValidos = 'Previsto' | 'PrevistoAcumulado' | 'Realizado' | 'RealizadoAcumulado';

type Serie = {
  periodo: string;
  data_valor: string;
  referencia: string;
  valor: number | null;
  indice?: number;
};

type SeriePorTipo = {
  [key in TiposValidos]: Serie;
};

type SeriesPorAno = {
  [ano: string]: SeriePorTipo[];
};

const alertStore = useAlertStore();

const variaveisGlobaisStore = useVariaveisGlobaisStore();
const variaveisCategoricasStore = useVariaveisCategoricasStore();

const props = defineProps({
  variavelId: {
    type: [
      Number,
      String,
    ],
    default: 0,
    required: true,
  },
  tipoDeValor: {
    type: String,
    required: true,
    validator: (value) => ['Previsto', 'Realizado'].includes(value as string),
  },
});

const emit = defineEmits(['close']);

const tituloIntroducao = (() => {
  switch (props.tipoDeValor) {
    case 'Previsto':
      return {
        titulo: 'Editar valores previstos',
        introducao: 'Preencher valores previstos e acumulados para cada período.',
      };
    case 'Realizado':
      return {
        titulo: 'Editar valores realizados',
        introducao: 'Preencher valores realizados retroativos para cada período.',
      };
    default:
      throw new Error(`tipoDeValor desconhecido: ${props.tipoDeValor}`);
  }
})();

const {
  seriesAgrupadas,
  chamadasPendentes,
  erros,
} = storeToRefs(variaveisGlobaisStore);

const opcoesVariaveisCategoricas = computed(() => {
  const categoriaId = seriesAgrupadas.value?.variavel?.variavel_categorica_id;
  if (!categoriaId) {
    return [];
  }

  return variaveisCategoricasStore.obterValoresVariavelCategoricaPorId(categoriaId);
});

const modoDePreenchimento = ref('valor_nominal'); // ou `valor_acumulado`
const valorPadrao = ref<number | ''>(0);

const SeriesAgrupadasPorAno = computed(() => (Array.isArray(seriesAgrupadas.value?.linhas)
  ? seriesAgrupadas.value.linhas.reduce((acc, cur) => {
    if (!acc[cur.agrupador]) {
      acc[cur.agrupador] = [];
    }
    const novaLinha = {} as SeriePorTipo;

    cur.series.forEach((serie: SerieValorNomimal | SerieIndicadorValorNominal, j: number) => {
      let valorNominal: number | null = null;
      if ('valor_nominal' in serie) {
        valorNominal = Number.parseFloat(serie.valor_nominal);
      }

      if (seriesAgrupadas.value?.ordem_series[j]) {
        novaLinha[seriesAgrupadas.value.ordem_series[j] as TiposValidos] = {
          periodo: cur.periodo,
          data_valor: 'data_valor' in serie ? serie.data_valor : '',
          valor: Number.isNaN(valorNominal)
            ? null
            : valorNominal,
          referencia: 'referencia' in serie ? serie.referencia : '',
        };
      }
    });

    acc[cur.agrupador].push(novaLinha);
    return acc;
  }, {} as SeriesPorAno)
  : {} as SeriesPorAno));

const {
  errors, handleSubmit, isSubmitting, setFieldValue, resetForm, resetField, values: carga,
} = useForm<SeriesPorAno>({
  initialValues: SeriesAgrupadasPorAno.value,
});

const formularioSujo = useIsFormDirty();

function buscarAcumuladoAnterior(ano: number, indice: number) {
  const digitos = carga[ano]?.[indice - 1]?.[`${props.tipoDeValor}Acumulado` as TiposValidos]?.valor
    ?? carga[ano - 1]?.[carga[ano - 1].length - 1]?.[`${props.tipoDeValor}Acumulado` as TiposValidos]?.valor
    ?? seriesAgrupadas.value?.variavel?.valor_base;

  const numero = Number(digitos);

  return Number.isNaN(numero)
    ? undefined
    : numero;
}

function atualizarAcumuladosEmCascata(ano: number | string, indice: number) {
  let chaveDoAno = Number(ano);
  let indiceDaSerie = indice;
  let valor = buscarAcumuladoAnterior(chaveDoAno, indice) ?? 0;

  while (carga[chaveDoAno]) {
    while (carga[chaveDoAno][indiceDaSerie]) {
      valor += Number(carga[chaveDoAno][indiceDaSerie][props.tipoDeValor as TiposValidos].valor)
        || 0;

      setFieldValue(`${chaveDoAno}[${indiceDaSerie}].${props.tipoDeValor}Acumulado.valor`, valor);

      indiceDaSerie += 1;
    }

    indiceDaSerie = 0;
    chaveDoAno += 1;
  }
}

// eslint-disable-next-line max-len
function atualizarAPartirDoAcumulado(valorFornecido: number | string, ano: number | string, indice: number) {
  const valor = typeof valorFornecido === 'number'
    ? valorFornecido
    : Number.parseFloat(valorFornecido.trim())
    || 0;

  const novoValor = valor - (buscarAcumuladoAnterior(Number(ano), indice) ?? 0);

  setFieldValue(`${ano}[${indice}].${props.tipoDeValor}.valor`, novoValor);

  if (seriesAgrupadas.value?.variavel?.acumulativa) {
    atualizarAcumuladosEmCascata(ano, indice + 1);
  }
}

const onSubmit = handleSubmit.withControlled(async (cargaControlada) => {
  const cargaManipulada = Object.values(cargaControlada)
    .flatMap((anos) => anos.flatMap((ano) => Object.values(ano).flatMap((serie) => (serie.referencia !== 'SS'
      ? nulificadorTotal({
        valor: serie.valor,
        referencia: serie.referencia,
      })
      : []))));

  try {
    const msg = 'Valores salvos!';
    const r = await variaveisGlobaisStore.salvarSeries({ valores: cargaManipulada });

    if (r) {
      alertStore.success(msg);
      emit('close');
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function preencherVaziosCom(valor: number | string) {
  Object.keys(carga).forEach((ano) => {
    carga[ano].forEach((serie, i: number) => {
      if (!serie[props.tipoDeValor as TiposValidos].valor
        && serie[props.tipoDeValor as TiposValidos].valor !== 0
      ) {
        switch (modoDePreenchimento.value) {
          case 'valor_nominal':
            setFieldValue(`${ano}[${i}].${props.tipoDeValor}.valor`, valor);
            break;

          case 'valor_acumulado':
            throw new Error('O prenchimento de vazios não faz sentido para `valor_acumulado`');

          default:
            throw new Error(`\`modoDePreenchimento\` inválido: \`${modoDePreenchimento.value}\`. Deveria ser \`valor_nominal\` ou \`valor_acumulado\`.`);
        }
      }
    });
  });
}

function limparFormulário() {
  Object.keys(carga).forEach((ano) => {
    carga[ano].forEach((_serie, i: number) => {
      switch (modoDePreenchimento.value) {
        case 'valor_nominal':
          resetField(`${ano}[${i}].${props.tipoDeValor}.valor`, { value: null });
          break;

        case 'valor_acumulado':
          resetField(`${ano}[${i}].${props.tipoDeValor}Acumulado.valor`, { value: null });
          break;

        default:
          throw new Error(`\`modoDePreenchimento\` inválido: \`${modoDePreenchimento.value}\`. Deveria ser \`valor_nominal\` ou \`valor_acumulado\`.`);
      }
    });
  });
}

watch(() => props.variavelId, (novoId) => {
  variaveisGlobaisStore.buscarSerie(novoId, { serie: props.tipoDeValor });
  variaveisCategoricasStore.buscarTudo();
}, {
  immediate: true,
});

watch(SeriesAgrupadasPorAno, (novoValor) => {
  modoDePreenchimento.value = 'valor_nominal';
  resetForm({
    values: novoValor,
  });
}, {
  immediate: true,
});
</script>
<template>
  <header class="flex g2 spacebetween center mb2">
    <h2>{{ tituloIntroducao.titulo }}</h2>

    <hr class="f1">

    <CheckClose
      :formulario-sujo="formularioSujo"
      :apenas-emitir="true"
      @close="emit('close')"
    />
  </header>
  <div v-if="Object.keys(SeriesAgrupadasPorAno).length">
    <p class="label mb1">
      {{ tituloIntroducao.introducao }}
    </p>

    <hr class="mb2">
    <auxiliarDePreenchimento>
      <div class="flex g2 end mb1">
        <div class="f1">
          <label class="label">Valor a aplicar</label>
          <select
            v-if="seriesAgrupadas?.variavel?.variavel_categorica_id"
            v-model="valorPadrao"
            :disabled="modoDePreenchimento === 'valor_acumulado'"
            class="inputtext light"
          >
            <option value="">
              ---
            </option>

            <option
              v-for="item in opcoesVariaveisCategoricas"
              :key="item.id"
              :value="item.valor_variavel"
            >
              {{ item.titulo }}
              {{ item.descricao && truncate(`- ${item.descricao}`, 55) }}
            </option>
          </select>

          <input
            v-else
            v-model="valorPadrao"
            type="number"
            class="inputtext light mb1"
            :disabled="modoDePreenchimento === 'valor_acumulado'"
          >
        </div>
        <button
          type="button"
          class="f0 mb1 btn bgnone outline tcprimary"
          :disabled="valorPadrao === '' || modoDePreenchimento === 'valor_acumulado'"
          @click="preencherVaziosCom(valorPadrao)"
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
          @click.prevent="resetForm()"
        >
          &excl; restaurar
        </button>
      </div>

      <template v-if="seriesAgrupadas?.variavel?.acumulativa">
        <hr class="mb2 f1">

        <div class="flex mb2">
          <label class="f1">
            <input
              v-model="modoDePreenchimento"
              type="radio"
              class="inputcheckbox"
              value="valor_nominal"
            ><span>Preencher por valor {{ $props.tipoDeValor?.toLowerCase() }}</span></label>
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
      @submit.prevent="onSubmit"
    >
      <details
        v-for="(ano, chave) in SeriesAgrupadasPorAno"
        :key="chave"
        class="mb2"
        :open="Object.keys(SeriesAgrupadasPorAno).length === 1"
      >
        <summary class="mb1">
          <h3 class="w700 mb0">
            {{ chave }}
          </h3>
        </summary>
        <div class="details-content">
          <table class="tablemain no-zebra mb1">
            <thead>
              <tr>
                <th />
                <th>Valor {{ $props.tipoDeValor }}</th>
                <th v-if="seriesAgrupadas?.variavel?.acumulativa">
                  Valor Acumulado
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(serie, idx) in ano"
                :key="idx"
              >
                <th>
                  {{ dateToTitle(serie[$props.tipoDeValor as TiposValidos].periodo) }}
                </th>

                <td>
                  <Field
                    v-if="seriesAgrupadas?.variavel?.variavel_categorica_id"
                    :disabled="modoDePreenchimento === 'valor_acumulado'"
                    :name="`${chave}[${idx}].${$props.tipoDeValor}.valor`"
                    class="inputtext light"
                    as="select"
                  >
                    <option value="">
                      ---
                    </option>

                    <option
                      v-for="item in opcoesVariaveisCategoricas"
                      :key="item.id"
                      :value="item.valor_variavel"
                    >
                      {{ item.titulo }}
                      {{ item.descricao && truncate(`- ${item.descricao}`, 55) }}
                    </option>
                  </Field>

                  <Field
                    v-else
                    :disabled="modoDePreenchimento === 'valor_acumulado'"
                    :name="`${chave}[${idx}].${$props.tipoDeValor}.valor`"
                    :aria-label="serie[$props.tipoDeValor as TiposValidos].periodo"
                    class="inputtext light"
                    type="number"
                    :step="geradorDeAtributoStep(seriesAgrupadas?.variavel?.casas_decimais)"
                    @update:model-value="() => {
                      if (
                        modoDePreenchimento === 'valor_nominal'
                        && seriesAgrupadas?.variavel?.acumulativa
                      ) {
                        atualizarAcumuladosEmCascata(chave, idx);
                      }
                    }"
                  />

                  <Field
                    :name="`${chave}[${idx}].${$props.tipoDeValor}.referencia`"
                    type="hidden"
                  />
                </td>

                <td v-if="seriesAgrupadas?.variavel?.acumulativa">
                  <Field
                    :disabled="modoDePreenchimento === 'valor_nominal'"
                    :name="`${chave}[${idx}].${$props.tipoDeValor}Acumulado.valor`"
                    :aria-label="`Acumulado ${serie[$props.tipoDeValor as TiposValidos].periodo}`"
                    type="number"
                    class="inputtext light"
                    @blur="($e) => {
                      if ($e.target.value === '') {
                        setFieldValue(`${chave}[${idx}].${$props.tipoDeValor}Acumulado.valor`, 0);
                      }
                    }"
                    @update:model-value="($v) => {
                      if (modoDePreenchimento === 'valor_acumulado') {
                        atualizarAPartirDoAcumulado($v, chave, idx);
                      }
                    }"
                  />

                  <Field
                    :name="`${chave}[${idx}].${$props.tipoDeValor}Acumulado.referencia`"
                    type="hidden"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <LoadingComponent v-if="chamadasPendentes.emFoco" />

      <ErrorComponent v-if="erros.emFoco" />

      <FormErrorsList :errors="errors" />

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
  </div>
  <div v-else>
    <p class="w600 t18 tc">
      Não há séries disponíveis
    </p>
  </div>
</template>
