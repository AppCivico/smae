<script setup>
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import CampoDeTagsComBuscaPorCategoria from '@/components/CampoDeTagsComBuscaPorCategoria.vue';
import TextEditor from '@/components/camposDeFormulario/TextEditor/index.ts';
import EnvioDeArquivos from '@/components/monitoramentoDeMetas/EnvioDeArquivos.vue';
import ListaDeDocumentos from '@/components/monitoramentoDeMetas/ListaDeDocumentos.vue';
import SmallModal from '@/components/SmallModal.vue';
import monitoramentoDeMetasFase, { chaveDoBloco } from '@/consts/formSchemas/monitoramentoDeMetasFase';
import { LIMITE_CAMPO_HTML } from '@/consts/limitesDeCampos';
import { useAlertStore } from '@/stores/alert.store';
import { useMonitoramentoDeMetasStore } from '@/stores/monitoramentoDeMetas.store';

const route = useRoute();

const props = defineProps({
  // configuração da fase, já filtrada para os blocos habilitados
  fase: {
    type: Object,
    required: true,
  },
  cicloId: {
    type: [
      Number,
      String,
    ],
    required: true,
  },
  // revisão corrente da fase no ciclo
  atual: {
    type: Object,
    default: null,
  },
  // última revisão da fase no ciclo anterior
  anterior: {
    type: Object,
    default: null,
  },
  documentos: {
    type: Array,
    default: () => [],
  },
  editavel: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:sujo', 'salvo', 'documentosAlterados']);

const alertStore = useAlertStore();
const monitoramentoDeMetasStore = useMonitoramentoDeMetasStore(route.meta.entidadeMãe);

const exibirSeletorDeArquivo = ref(false);

// o `requestS` já alerta as falhas de HTTP; aqui o erro fica junto ao formulário
const erroAoSalvar = computed(() => monitoramentoDeMetasStore.erros.salvarFase[props.fase.id]);

// fases de tags não aceitam blocos de texto
const blocos = computed(() => (props.fase.aceita_tags
  ? []
  : props.fase.blocos || []));

const schema = computed(() => monitoramentoDeMetasFase(
  blocos.value,
  { aceitaTags: props.fase.aceita_tags },
));

function mapearConteudoPorBloco(revisao) {
  return (revisao?.blocos || []).reduce((acc, bloco) => {
    acc[chaveDoBloco(bloco.bloco_id)] = bloco.conteudo;
    return acc;
  }, {});
}

const conteudoAnteriorPorBloco = computed(() => mapearConteudoPorBloco(props.anterior));

const valoresIniciais = computed(() => {
  const conteudoAtualPorBloco = mapearConteudoPorBloco(props.atual);

  return {
    blocos: blocos.value.reduce((acc, bloco) => {
      acc[chaveDoBloco(bloco.id)] = conteudoAtualPorBloco[chaveDoBloco(bloco.id)] || '';
      return acc;
    }, {}),
    ...(props.fase.aceita_tags
      ? {
        tags: (props.atual?.tags || [])
          .filter((tag) => !tag.removido)
          .map((tag) => tag.id),
      }
      : {}),
  };
});

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values,
} = useForm({
  initialValues: valoresIniciais.value,
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  const carga = props.fase.aceita_tags
    ? { tags: valoresControlados.tags || [] }
    : {
      blocos: blocos.value.map((bloco) => ({
        bloco_id: bloco.id,
        conteudo: valoresControlados.blocos[chaveDoBloco(bloco.id)],
      })),
    };

  try {
    if (await monitoramentoDeMetasStore.salvarFaseDoCiclo(
      route.params.planoSetorialId,
      props.cicloId,
      props.fase.id,
      route.params.meta_id,
      carga,
    )) {
      alertStore.success(`Fase "${props.fase.rotulo}" atualizada!`);

      // sem aguardar a recarga, o formulário continuaria sujo
      resetForm({ values: valoresControlados });
      emit('salvo');
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function excluirDocumento(documento) {
  alertStore.confirmAction(`Deseja mesmo remover o arquivo ${documento.arquivo.nome_original}?`, async () => {
    const exclusao = await monitoramentoDeMetasStore.desassociarDocumentoDeFase(
      route.params.planoSetorialId,
      props.cicloId,
      documento.id,
      route.params.meta_id,
    );

    if (exclusao) {
      alertStore.success('Documento excluído com sucesso!');
      emit('documentosAlterados');
    } else {
      alertStore.error('Erro ao excluir documento!');
    }
  }, 'Remover');
}

function encerrarInclusaoDeArquivos() {
  exibirSeletorDeArquivo.value = false;

  emit('documentosAlterados');
}

// comparando o conteúdo porque a recarga das fases, após o salvamento de uma
// delas, troca todos os objetos e descartaria o que foi digitado nas demais
watch(() => JSON.stringify(valoresIniciais.value), () => {
  resetForm({ values: valoresIniciais.value });
});

watch(formularioSujo, (novoValor) => {
  emit('update:sujo', novoValor);
}, { immediate: true });
</script>
<template>
  <ErrorComponent
    v-if="!fase.aceita_tags && !blocos.length"
    class="t12 tc300 w700"
  >
    Nenhum bloco habilitado nessa fase.
  </ErrorComponent>

  <form
    v-else
    class="flex column g2"
    :disabled="isSubmitting"
    :aria-busy="isSubmitting"
    @submit.prevent="onSubmit"
  >
    <p
      v-if="!editavel"
      class="flex center g1"
    >
      <svg
        class="f0"
        width="24"
        height="24"
        color="#F2890D"
        aria-hidden="true"
      ><use xlink:href="#i_alert" /></svg>
      Essa fase não pode ser editada no momento. O ciclo pode estar fechado ou
      haver fases anteriores ainda não preenchidas.
    </p>

    <fieldset
      class="flex column g2"
      :disabled="!editavel"
    >
      <template
        v-for="bloco in blocos"
        :key="bloco.id"
      >
        <div class="label-com-botao">
          <button
            class="label-com-botao__botao btn bgnone tcprimary outline"
            type="button"
            :disabled="!conteudoAnteriorPorBloco[chaveDoBloco(bloco.id)]"
            :aria-disabled="!conteudoAnteriorPorBloco[chaveDoBloco(bloco.id)]"
            :title="!conteudoAnteriorPorBloco[chaveDoBloco(bloco.id)] && 'Nenhum conteúdo anterior'"
            @click="setFieldValue(
              `blocos.${chaveDoBloco(bloco.id)}`,
              conteudoAnteriorPorBloco[chaveDoBloco(bloco.id)],
            )"
          >
            Repetir anterior
          </button>
          <label
            :for="`fase-${fase.id}__${chaveDoBloco(bloco.id)}`"
            class="label-com-botao__label"
          >
            {{ bloco.rotulo }}
          </label>
          <div class="label-com-botao__campo">
            <Field
              v-slot="{ field }"
              :name="`blocos.${chaveDoBloco(bloco.id)}`"
            >
              <TextEditor
                :id="`fase-${fase.id}__${chaveDoBloco(bloco.id)}`"
                v-bind="field"
                :disabled="!editavel"
                :limite="LIMITE_CAMPO_HTML"
              />
            </Field>
          </div>
        </div>
        <ErrorMessage
          class="error-msg"
          :name="`blocos.${chaveDoBloco(bloco.id)}`"
        />
      </template>

      <fieldset v-if="fase.aceita_tags">
        <legend class="legend mb1">
          Tags
        </legend>
        <CampoDeTagsComBuscaPorCategoria
          :model-value="values.tags || []"
          name="tags"
          :valores-iniciais="valoresIniciais.tags"
          :pdm-id="Number(route.params.planoSetorialId)"
        />
        <ErrorMessage
          class="error-msg"
          name="tags"
        />
      </fieldset>

      <template v-if="fase.aceita_anexos">
        <ListaDeDocumentos
          :arquivos="documentos"
          :permitir-exclusao="editavel"
          @apagar="excluirDocumento($event)"
        />

        <div v-if="editavel">
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
      </template>

      <ErrorComponent :erro="erroAoSalvar" />

      <SmaeFieldsetSubmit
        v-if="editavel"
        :esta-carregando="isSubmitting"
        :erros="errors"
      />
    </fieldset>
  </form>

  <!-- fora do formulário da fase, porque o envio tem um formulário próprio -->
  <SmallModal
    v-if="exibirSeletorDeArquivo"
    has-close-button
    @close="exibirSeletorDeArquivo = false"
  >
    <EnvioDeArquivos
      :fase-id="fase.id"
      @envio-bem-sucedido="encerrarInclusaoDeArquivos"
    />
  </SmallModal>
</template>
