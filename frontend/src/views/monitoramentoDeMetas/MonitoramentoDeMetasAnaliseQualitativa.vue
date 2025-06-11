<script setup>
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
import EnvioDeArquivos from '@/components/monitoramentoDeMetas/EnvioDeArquivos.vue';
import ListaDeDocumentos from '@/components/monitoramentoDeMetas/ListaDeDocumentos.vue';
import SmallModal from '@/components/SmallModal.vue';
import TextEditor from '@/components/TextEditor.vue';
import { monitoramentoDeMetasAnalise as schema } from '@/consts/formSchemas';
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
  analiseEmFoco,
  cicloAtivo,
  ciclosDetalhadosPorId,
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
  informacoes_complementares:
      analiseEmFoco.value?.anterior.analises[0]?.informacoes_complementares,
  meta_id: route.params.meta_id,
  criador: analiseEmFoco.value?.anterior.analises[0]?.criador,
  criado_em: analiseEmFoco.value?.anterior.analises[0]?.criado_em,
}));

const {
  errors,
  handleSubmit,
  isSubmitting,
  resetForm,
  setFieldValue,
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

function atualizarListaDeArquivos() {
  monitoramentoDeMetasStore
    .atualizarListaDeArquivosDaAnaliseEmFoco(route.params.planoSetorialId, route.params.cicloId, {
      meta_id: route.params.meta_id,
    });
}

function excluirArquivoDaAnaliseEmFoco(arquivo) {
  alertStore.confirmAction(`Deseja mesmo remover o arquivo ${arquivo.arquivo.nome_original}?`, async () => {
    const exclusao = await monitoramentoDeMetasStore.desassociarDocumentoComAnalise(
      route.params.planoSetorialId,
      route.params.cicloId,
      arquivo.id,
      {
        meta_id: route.params.meta_id,
      },
    );

    if (exclusao) {
      alertStore.success('Documento excluído com sucesso!');
      atualizarListaDeArquivos();
    } else {
      alertStore.error('Erro ao excluir documento!');
    }
  }, 'Remover');
}

function encerrarInclusaoDeArquivos() {
  exibirSeletorDeArquivo.value = false;

  atualizarListaDeArquivos();
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

    <CheckClose :formulario-sujo="formularioSujo" />
  </div>

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
        :disabled="!analiseAnterior?.informacoes_complementares"
        :aria-disabled="!analiseAnterior?.informacoes_complementares"
        :title="
          !analiseAnterior?.informacoes_complementares && 'Nenhuma informação complementar anterior'
        "
        @click="
          setFieldValue('informacoes_complementares', analiseAnterior.informacoes_complementares)
        "
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
          <TextEditor v-bind="field" />
        </Field>
      </div>
    </div>
    <ErrorMessage
      class="error-msg"
      name="informacoes_complementares"
    />

    <ListaDeDocumentos
      :arquivos="analiseEmFoco?.arquivos"
      permitir-exclusao
      @apagar="excluirArquivoDaAnaliseEmFoco($event)"
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
        >
          <use xlink:href="#i_+" />
        </svg> <span>Adicionar documentos</span>
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
