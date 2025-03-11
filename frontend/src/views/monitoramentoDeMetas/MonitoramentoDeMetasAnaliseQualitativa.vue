<script setup>
import dateToTitle from '@/helpers/dateToTitle';
import { dateToShortDate } from '@/helpers/dateToDate';
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
  computed,
  ref, watch, watchEffect,
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
  cicloAtivo,
} = storeToRefs(monitoramentoDeMetasStore);

if (!cicloAtivo.value) {
  monitoramentoDeMetasStore
    .buscarListaDeCiclos(route.params.planoSetorialId, { meta_id: route.params.meta_id });
}

const exibirSeletorDeArquivo = ref(false);

const analiseEmFocoParaEdicao = computed(() => ({
  ciclo_fisico_id: route.params.cicloId,
  informacoes_complementares: analiseEmFoco.value?.corrente.analises[0]?.informacoes_complementares,
  meta_id: route.params.meta_id,
}));

const analiseAnterior = computed(() => ({
  ciclo_fisico_id: route.params.cicloId,
  informacoes_complementares: analiseEmFoco.value?.corrente.analises[0]?.informacoes_complementares,
  meta_id: route.params.meta_id,
  criador: analiseEmFoco.value?.anterior.analises[0]?.criador,
  criado_em: analiseEmFoco.value?.anterior.analises[0]?.criado_em,
}));

const {
  errors,
  handleSubmit,
  isSubmitting,
  resetField,
  resetForm,
  setFieldValue,
  values,
  controlledValues,
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

  // TODO: Implementar a atualização da lista de arquivos
  // de algum jeito que não cubra a edição corrente.
  // await monitoramentoDeMetasStore
  //   .buscarAnaliseDoCiclo(route.params.planoSetorialId, route.params.cicloId, {
  //     meta_id: route.params.meta_id,
  //   });

  // await nextTick();
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

  <div class="flex spacebetween center mb2">
    <TítuloDePágina />

    <hr class="ml2 f1">

    <CheckClose
      :formulario-sujo="formularioSujo"
    />
  </div>

  <!-- eslint-disable -->
  <div class="debug flex flexwrap g2 mb1" hidden>
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
  <!-- eslint-enable -->

  <form
    class="flex column g2"
    :disabled="isSubmitting"
    :aria-busy="isSubmitting || chamadasPendentes.analiseEmFoco"
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
        :disabled="!analiseAnterior?.detalhamento"
        :aria-disabled="!analiseAnterior?.detalhamento"
        :title="!analiseAnterior?.detalhamento ? 'Nenhuma informação complementar anterior' : ''"
        @click="setFieldValue('detalhamento', analiseAnterior.informacoes_complementares)"
      >
        Repetir anterior
      </button>
      <label
        for="detalhamento"
        class="label-com-botao__label"
      >
        Informações complementares
      </label>
      <div class="label-com-botao__campo">
        <Field
          v-slot="{ field }"
          name="informacoes_complementares"
        >
          <TextEditor
            v-bind="field"
          />
        </Field>
      </div>
    </div>
    <ErrorMessage
      class="error-msg"
      name="informacoes_complementares"
    />

    <div>
      <button
        type="button"
        class="addlink mb1"
        @click="exibirSeletorDeArquivo = !exibirSeletorDeArquivo"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_+" /></svg> <span>Adicionar documentos</span>
      </button>
    </div>

    <FormErrorsList :errors="errors" />

    <div class="titulo-monitoramento titulo-monitoramento--passado">
      <h2 class="tc500 t20 titulo-monitoramento__text">
        <span class="w400">
          {{ dateToTitle(analiseAnterior.referencia_data) }}
        </span>
      </h2>
    </div>

    <template v-if="!analiseAnterior.criado_em">
      <p class="t12 tc300 w700">
        Nenhum análise anterior encontrada.
      </p>
    </template>
    <template v-else>
      <div class="t12 uc w700 mb05 tc300 flex column g1">
        Informações complementares
        <hr>
        <div
          class="t13 contentStyle"
          v-html="analiseAnterior?.informacoes_complementares || '-'"
        />
      </div>
      <hr>
      <footer
        v-if="analiseAnterior?.criador?.nome_exibicao || analiseAnterior?.criado_em"
        class="tc600"
      >
        <p>
          Analisado
          <template v-if="analiseAnterior.criador?.nome_exibicao">
            por <strong>{{ analiseAnterior.criador.nome_exibicao }}</strong>
          </template>
          <template v-if="analiseAnterior.criado_em">
            em <time :datetime="analiseAnterior.criado_em">
              {{ dateToShortDate(analiseAnterior.criado_em) }}
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

  <SmallModal
    v-if="exibirSeletorDeArquivo"
    has-close-button
    @close="exibirSeletorDeArquivo = false"
  >
    <EnvioDeArquivos @envio-bem-sucedido="encerrarInclusaoDeArquivos" />
  </SmallModal>
</template>
