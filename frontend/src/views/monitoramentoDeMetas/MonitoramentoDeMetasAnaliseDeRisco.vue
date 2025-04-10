<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { computed, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TextEditor from '@/components/TextEditor.vue';
import { monitoramentoDeMetasRisco as schema } from '@/consts/formSchemas';
import { dateToShortDate } from '@/helpers/dateToDate';
import dateToTitle from '@/helpers/dateToTitle';
import { useAlertStore } from '@/stores/alert.store';
import { useMonitoramentoDeMetasStore } from '@/stores/monitoramentoDeMetas.store';

const route = useRoute();
const router = useRouter();

const monitoramentoDeMetasStore = useMonitoramentoDeMetasStore(route.meta.entidadeMãe);
const alertStore = useAlertStore();

const {
  chamadasPendentes,
  erros,
  riscoEmFoco,
  cicloAtivo,
  ciclosDetalhadosPorId,
} = storeToRefs(monitoramentoDeMetasStore);

if (!cicloAtivo.value) {
  monitoramentoDeMetasStore
    .buscarListaDeCiclos(route.params.planoSetorialId, { meta_id: route.params.meta_id });
}

const riscoEmFocoParaEdicao = computed(() => ({
  ciclo_fisico_id: route.params.cicloId,
  detalhamento: riscoEmFoco.value?.corrente.riscos[0]?.detalhamento,
  meta_id: route.params.meta_id,
  ponto_de_atencao: riscoEmFoco.value?.corrente.riscos[0]?.ponto_de_atencao,
  referencia_data: riscoEmFoco.value?.corrente.riscos[0]?.referencia_data,
}));

const riscoAnterior = computed(() => ({
  detalhamento: riscoEmFoco.value?.anterior.riscos[0]?.detalhamento,
  ponto_de_atencao: riscoEmFoco.value?.anterior.riscos[0]?.ponto_de_atencao,
  referencia_data: riscoEmFoco.value?.anterior.riscos[0]?.referencia_data,
  criador: riscoEmFoco.value?.anterior.riscos[0]?.criador,
  criado_em: riscoEmFoco.value?.anterior.riscos[0]?.criado_em,
}));

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue,
} = useForm({
  initialValues: riscoEmFocoParaEdicao.value,
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    if (await monitoramentoDeMetasStore.salvarRiscoDeCiclo(
      route.params.planoSetorialId,
      route.params.cicloId,
      valoresControlados,
    )) {
      alertStore.success('Análise de risco atualizada!');

      if (route.meta.rotaDeEscape) {
        if (ciclosDetalhadosPorId.value[route.params.cicloId]) {
          delete ciclosDetalhadosPorId.value[route.params.cicloId];
        }

        router.push({
          name: route.meta.rotaDeEscape,
          params: route.params,
          query: route.query,
        });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
});

watch(riscoEmFocoParaEdicao, (novoValor) => {
  resetForm({ values: novoValor });
});

watchEffect(() => {
  monitoramentoDeMetasStore
    .buscarRiscoDoCiclo(route.params.planoSetorialId, route.params.cicloId, {
      meta_id: route.params.meta_id,
    });
});
</script>
<template>
  <MigalhasDePao />

  <div class="flex spacebetween center mb2">
    <TítuloDePágina />

    <hr class="ml2 f1">

    <CheckClose
      :formulario-sujo="formularioSujo"
    />
  </div>

  <ErrorComponent :erro="erros.riscoEmFoco" />

  <form
    class="flex column g2"
    :disabled="isSubmitting"
    :aria-busy="isSubmitting || chamadasPendentes.riscoEmFoco"
    @submit.prevent="onSubmit"
  >
    <Field
      name="ciclo_fisico_id"
      type="hidden"
    />
    <Field
      name="meta_id"
      type="hidden"
    />

    <div class="titulo-monitoramento">
      <h2 class="tc500 t20 titulo-monitoramento__text">
        <span class="w400">
          Ciclo Atual: {{ dateToTitle(cicloAtivo?.data_ciclo) }}
        </span>
      </h2>
    </div>

    <div class="label-com-botao">
      <button
        class="label-com-botao__botao btn bgnone tcprimary outline"
        type="button"
        :disabled="!riscoAnterior?.detalhamento"
        :aria-disabled="!riscoAnterior?.detalhamento"
        :title="!riscoAnterior?.detalhamento && 'Nenhum detalhamento anterior'"
        @click="setFieldValue('detalhamento', riscoAnterior.detalhamento)"
      >
        Repetir anterior
      </button>
      <label
        for="detalhamento"
        class="label-com-botao__label"
      >
        Detalhamento
      </label>
      <div class="label-com-botao__campo">
        <Field
          v-slot="{ field }"
          name="detalhamento"
        >
          <TextEditor
            v-bind="field"
          />
        </Field>
      </div>
    </div>

    <ErrorMessage
      class="error-msg"
      name="detalhamento"
    />

    <div class="label-com-botao">
      <button
        class="label-com-botao__botao btn bgnone tcprimary outline"
        type="button"
        :disabled="!riscoAnterior?.ponto_de_atencao"
        :aria-disabled="!riscoAnterior?.ponto_de_atencao"
        :title="!riscoAnterior?.ponto_de_atencao && 'Nenhum ponto de atenção anterior'"
        @click="setFieldValue('ponto_de_atencao', riscoAnterior.ponto_de_atencao)"
      >
        Repetir anterior
      </button>

      <label class="label-com-botao__label">
        Pontos de Atenção
      </label>
      <div class="label-com-botao__campo">
        <Field
          v-slot="{ field }"
          name="ponto_de_atencao"
        >
          <TextEditor
            v-bind="field"
          />
        </Field>
      </div>
    </div>
    <ErrorMessage
      class="error-msg"
      name="ponto_de_atencao"
    />

    <FormErrorsList :errors="errors" />

    <div class="titulo-monitoramento titulo-monitoramento--passado">
      <h2 class="tc500 t20 titulo-monitoramento__text">
        <span class="w400">
          {{ dateToTitle(riscoAnterior.referencia_data) }}
        </span>
      </h2>
    </div>
    <template v-if="!riscoAnterior.criado_em">
      <p class="t12 tc300 w700">
        Nenhum risco anterior encontrado.
      </p>
    </template>
    <template v-else>
      <div class="t12 uc w700 mb05 tc300 flex column g1">
        Detalhamento
        <hr>
        <div
          class="t13 contentStyle"
          v-html="riscoAnterior?.detalhamento || '-'"
        />
      </div>
      <div class="t12 uc w700 mb05 tc300 flex column g1">
        Pontos de Atenção
        <hr>
        <div
          class="t13 contentStyle"
          v-html="riscoAnterior?.ponto_de_atencao || '-'"
        />
      </div>

      <footer
        v-if="riscoAnterior?.criador?.nome_exibicao || riscoAnterior?.criado_em"
        class="tc600"
      >
        <p>
          Analisado
          <template v-if="riscoAnterior.criador?.nome_exibicao">
            por <strong>{{ riscoAnterior.criador.nome_exibicao }}</strong>
          </template>
          <template v-if="riscoAnterior.criado_em">
            em <time :datetime="riscoAnterior.criado_em">
              {{ dateToShortDate(riscoAnterior.criado_em) }}
            </time>.
          </template>
        </p>
      </footer>
    </template>

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        type="submit"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </form>
</template>
