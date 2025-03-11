<script setup>
import { monitoramentoDeMetasFechamento as schema } from '@/consts/formSchemas';
import { dateToShortDate } from '@/helpers/dateToDate';
import dateToTitle from '@/helpers/dateToTitle';
import { useAlertStore } from '@/stores/alert.store';
import { useMonitoramentoDeMetasStore } from '@/stores/monitoramentoDeMetas.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { computed, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const monitoramentoDeMetasStore = useMonitoramentoDeMetasStore(route.meta.entidadeMãe);
const alertStore = useAlertStore();

const {
  chamadasPendentes,
  erros,
  fechamentoEmFoco,
  cicloAtivo,
} = storeToRefs(monitoramentoDeMetasStore);

if (!cicloAtivo.value) {
  monitoramentoDeMetasStore
    .buscarListaDeCiclos(route.params.planoSetorialId, { meta_id: route.params.meta_id });
}

const fechamentoEmFocoParaEdicao = computed(() => ({
  ciclo_fisico_id: route.params.cicloId,
  comentario: fechamentoEmFoco.value?.corrente.fechamentos[0]?.comentario,
  meta_id: route.params.meta_id,
}));

const fechamentoAnterior = computed(() => ({
  comentario: fechamentoEmFoco.value?.anterior.fechamentos[0]?.comentario,
  criador: fechamentoEmFoco.value?.anterior.fechamentos[0]?.criador,
  criado_em: fechamentoEmFoco.value?.anterior.fechamentos[0]?.criado_em,
}));

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue,
} = useForm({
  initialValues: fechamentoEmFocoParaEdicao.value,
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    if (await monitoramentoDeMetasStore.salvarFechamentoDeCiclo(
      route.params.planoSetorialId,
      route.params.cicloId,
      valoresControlados,
    )) {
      alertStore.success('Análise de risco atualizada!');
      if (route.meta.rotaDeEscape) {
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

watch(fechamentoEmFocoParaEdicao, (novoValor) => {
  resetForm({ values: novoValor });
});

watchEffect(() => {
  monitoramentoDeMetasStore
    .buscarFechamentoDoCiclo(route.params.planoSetorialId, route.params.cicloId, {
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
        :disabled="!fechamentoAnterior?.detalhamento"
        :aria-disabled="!fechamentoAnterior?.detalhamento"
        :title="!fechamentoAnterior?.detalhamento ? 'Nenhum detalhamento anterior' : ''"
        @click="setFieldValue('detalhamento', fechamentoAnterior.detalhamento)"
      >
        Repetir anterior
      </button>
      <label
        for="comentario"
        class="label-com-botao__label"
      >
        Comentário
      </label>
      <div class="label-com-botao__campo">
        <Field
          as="textarea"
          name="comentario"
          rows="5"
          class="inputtext light mb1"
          :class="{ 'error': errors.comentario }"
        />
      </div>
    </div>
    <ErrorMessage
      class="error-msg"
      name="comentario"
    />

    <FormErrorsList :errors="errors" />

    <div class="titulo-monitoramento titulo-monitoramento--passado">
      <h2 class="tc500 t20 titulo-monitoramento__text">
        <span class="w400">
          {{ dateToTitle(fechamentoAnterior.referencia_data) }}
        </span>
      </h2>
    </div>
    <template v-if="!fechamentoAnterior.criado_em">
      <p class="t12 tc300 w700">
        Nenhum fechamento anterior encontrado.
      </p>
    </template>
    <template v-else>
      <div class="t12 uc w700 mb05 tc300 flex column g1">
        Comentários
        <hr>
        <div
          class="t13 contentStyle"
          v-html="fechamentoAnterior?.comentario || '-'"
        />
      </div>
      <hr>
      <footer
        v-if="fechamentoAnterior?.criador?.nome_exibicao || fechamentoAnterior?.criado_em"
        class="tc600"
      >
        <p>
          Analisado
          <template v-if="fechamentoAnterior.criador?.nome_exibicao">
            por <strong>{{ fechamentoAnterior.criador.nome_exibicao }}</strong>
          </template>
          <template v-if="fechamentoAnterior.criado_em">
            em <time :datetime="fechamentoAnterior.criado_em">
              {{ dateToShortDate(fechamentoAnterior.criado_em) }}
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
