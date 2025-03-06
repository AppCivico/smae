<script setup>
import TextEditor from '@/components/TextEditor.vue';
import { monitoramentoDeMetasRisco as schema } from '@/consts/formSchemas';
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
  riscoEmFoco,
} = storeToRefs(monitoramentoDeMetasStore);

const riscoEmFocoParaEdicao = computed(() => ({
  ciclo_fisico_id: route.params.cicloId,
  detalhamento: riscoEmFoco.value?.corrente.riscos[0]?.detalhamento,
  meta_id: route.params.meta_id,
  ponto_de_atencao: riscoEmFoco.value?.corrente.riscos[0]?.ponto_de_atencao,
}));

const {
  errors, handleSubmit, isSubmitting, resetField, resetForm, setFieldValue, values,
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

  Analise de risco

  <CheckClose
    :formulario-sujo="formularioSujo"
  />

  <ErrorComponent :erro="erros.riscoEmFoco" />

  <form
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

    <Field
      v-slot="{ field }"
      name="detalhamento"
    >
      <TextEditor
        v-bind="field"
      />
    </Field>
    <ErrorMessage
      class="error-msg"
      name="detalhamento"
    />

    <Field
      v-slot="{ field }"
      name="ponto_de_atencao"
    >
      <TextEditor
        v-bind="field"
      />
    </Field>
    <ErrorMessage
      class="error-msg"
      name="ponto_de_atencao"
    />

    <FormErrorsList :errors="errors" />

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
