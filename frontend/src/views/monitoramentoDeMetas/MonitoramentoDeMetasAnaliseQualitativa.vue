<script setup>
import EnvioDeArquivos from '@/components/monitoramentoDeMetas/EnvioDeArquivos.vue';
import SmallModal from '@/components/SmallModal.vue';
import TextEditor from '@/components/TextEditor.vue';
import { monitoramentoDeMetasAnalise as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useMonitoramentoDeMetasStore } from '@/stores/monitoramentoDeMetas.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import {
  computed, nextTick, ref, watch, watchEffect,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const monitoramentoDeMetasStore = useMonitoramentoDeMetasStore(route.meta.entidadeMãe);
const alertStore = useAlertStore();

const {
  chamadasPendentes,
  erros,
  analiseEmFoco,
} = storeToRefs(monitoramentoDeMetasStore);

const exibirSeletorDeArquivo = ref(false);

const analiseEmFocoParaEdicao = computed(() => ({
  ciclo_fisico_id: route.params.cicloId,
  informacoes_complementares: analiseEmFoco.value?.corrente.analises[0]?.informacoes_complementares,
  meta_id: route.params.meta_id,
}));

const {
  errors, handleSubmit, isSubmitting, resetField, resetForm, setFieldValue, values, controlledValues,
} = useForm({
  initialValues: analiseEmFoco.value,
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    if (await monitoramentoDeMetasStore.salvarAnaliseDeCiclo(
      route.params.planoSetorialId,
      route.params.cicloId,
      valoresControlados,
    )) {
      alertStore.success('Análise qualitativa atualizada!');
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

async function encerrarInclusaoDeArquivos() {
  exibirSeletorDeArquivo.value = false;

  await monitoramentoDeMetasStore
    .buscarAnaliseDoCiclo(route.params.planoSetorialId, route.params.cicloId, {
      meta_id: route.params.meta_id,
    });

  await nextTick();
}

watch(analiseEmFocoParaEdicao, (novoValor) => {
  resetForm({ values: novoValor });
});

watchEffect(() => {
  monitoramentoDeMetasStore
    .buscarAnaliseDoCiclo(route.params.planoSetorialId, route.params.cicloId, {
      meta_id: route.params.meta_id,
    });
});
</script>
<template>
  <MigalhasDePao />

  Analise Qualitativa

  <CheckClose
    :formulario-sujo="formularioSujo"
  />

  <div class="debug flex flexwrap g2 mb1">
    <pre class="fb100 mb0">chamadasPendentes.analiseEmFoco: {{ chamadasPendentes.analiseEmFoco }}</pre>
    <pre class="fb100 mb0">erros.analiseEmFoco: {{ erros.analiseEmFoco }}</pre>

    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >analiseEmFoco: {{ analiseEmFoco }}</textarea>

    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >analiseEmFocoParaEdicao: {{ analiseEmFocoParaEdicao }}</textarea>

    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >values: {{ values }}</textarea>
  </div>

  <pre>
analiseEmFoco?.corrente?.arquivos?.length: {{ analiseEmFoco?.corrente?.arquivos?.length }}
</pre>

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
      name="informacoes_complementares"
    >
      <TextEditor
        v-bind="field"
      />
    </Field>
    <ErrorMessage
      class="error-msg"
      name="informacoes_complementares"
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

  <button
    type="button"
    @click="exibirSeletorDeArquivo = !exibirSeletorDeArquivo"
  >
    Adicionar documento
  </button>

  <SmallModal
    v-if="exibirSeletorDeArquivo"
    has-close-button
    @close="exibirSeletorDeArquivo = false"
  >
    <EnvioDeArquivos @envio-bem-sucedido="encerrarInclusaoDeArquivos" />
  </SmallModal>
</template>
