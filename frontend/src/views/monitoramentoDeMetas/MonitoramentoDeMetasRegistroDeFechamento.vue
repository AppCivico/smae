<script setup>
import TextEditor from '@/components/TextEditor.vue';
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
} = storeToRefs(monitoramentoDeMetasStore);

const fechamentoEmFocoParaEdicao = computed(() => ({
  ciclo_fisico_id: route.params.cicloId,
  comentario: fechamentoEmFoco.value?.corrente.fechamentos[0].comentario,
  meta_id: route.params.meta_id,
}));

const {
  errors, handleSubmit, isSubmitting, resetField, resetForm, setFieldValue, values,
} = useForm({
  initialValues: fechamentoEmFocoParaEdicao.value,
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

  Registro de fechamento

  <CheckClose
    :formulario-sujo="formularioSujo"
  />

  <div class="debug flex flexwrap g2 mb1">
    <pre class="fb100 mb0">chamadasPendentes.fechamentoEmFoco: {{ chamadasPendentes.fechamentoEmFoco }}</pre>
    <pre class="fb100 mb0">erros.fechamentoEmFoco: {{ erros.fechamentoEmFoco }}</pre>

    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >fechamentoEmFoco: {{ fechamentoEmFoco }}</textarea>

    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >fechamentoEmFocoParaEdicao: {{ fechamentoEmFocoParaEdicao }}</textarea>

    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >values: {{ values }}</textarea>
  </div>

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
      name="comentario"
    >
      <TextEditor
        v-bind="field"
      />
    </Field>
    <ErrorMessage
      class="error-msg"
      name="comentario"
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
