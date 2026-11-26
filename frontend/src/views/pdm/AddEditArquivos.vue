<script setup>
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import {
  computed, reactive, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';
import * as Yup from 'yup';

import {
  arquivoTemExtensaoPermitida,
  extensoesComoTexto,
  extensoesParaAccept,
  listarExtensoes,
} from '@/helpers/extensoesDeArquivo';
import requestS from '@/helpers/requestS.ts';
import { router } from '@/router';
import {
  useAlertStore,
  useEditModalStore, usePdMStore,
} from '@/stores';
import { useTiposDeDocumentosStore } from '@/stores/tiposDeDocumentos.store';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const { pdm_id } = route.params;

const props = defineProps(['props']);

const tiposDeDocumentosStore = useTiposDeDocumentosStore();
const {
  lista: listaDeTiposDeDocumentos,
  tiposPorId,
  chamadasPendentes: chamadasPendentesDeTipos,
} = storeToRefs(tiposDeDocumentosStore);
tiposDeDocumentosStore.buscarTudo();

const tipoDocumentoId = ref('');
const erroDeArquivo = ref('');

const extensoesPermitidas = computed(() => (tipoDocumentoId.value
  ? listarExtensoes(tiposPorId.value[tipoDocumentoId.value]?.extensoes)
  : []));

const PdMStore = usePdMStore();
const { singlePdm } = storeToRefs(PdMStore);
if (!singlePdm.value.id || singlePdm.value.id != pdm_id) PdMStore.getById(pdm_id);

const title = 'Adicionar arquivo';

const schema = Yup.object().shape({
  descricao: Yup.string().required('Preencha a descrição'),
  tipo_documento_id: Yup.string().required('Escolha um tipo de documento'),
  arquivo: Yup.string().required('Selecione um arquivo'),
});

const curfile = reactive({});

async function onSubmit(values) {
  try {
    let msg;
    let r;

    curfile.loading = true;
    values.tipo = 'DOCUMENTO';
    const formData = new FormData();
    Object.entries(values).forEach((x) => {
      if (x[0] !== 'descricao') {
        formData.append(x[0], x[1]);
      }
    });

    const u = await requestS.upload(`${baseUrl}/upload`, formData);
    if (u.upload_token) {
      r = await PdMStore.insertArquivo(pdm_id, {
        upload_token: u.upload_token,
        descricao: values.descricao,
      });
      if (r == true) {
        msg = 'Item adicionado com sucesso!';
        PdMStore.clearLoad();
        alertStore.success(msg);
        editModalStore.clear();
        if (props.props.parentPage == 'pdm') PdMStore.filterPdM();
        await router.push(`/${props.props.parentPage}`);
        curfile.loading = false;
      }
    } else {
      curfile.loading = false;
    }
  } catch (error) {
    alertStore.error(error);
    curfile.loading = false;
  }
}
async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    router.push(`/${props.props.parentPage}`);
    editModalStore.clear();
    alertStore.clear();
  });
}
function removerArquivo() {
  curfile.name = '';
  curfile.file = undefined;
}

function mensagemDeExtensaoInvalida(nomeDoArquivo) {
  return `"${nomeDoArquivo}" não é aceito para este tipo de documento. `
    + `Extensões permitidas: ${extensoesComoTexto(extensoesPermitidas.value)}.`;
}

function addFile(e) {
  const { files } = e.target;
  const [arquivo] = files;
  e.target.value = '';

  if (!arquivo) return;

  // `accept` só sugere ao seletor do sistema; a pessoa ainda pode escolher "Todos os arquivos"
  if (!arquivoTemExtensaoPermitida(arquivo.name, extensoesPermitidas.value)) {
    removerArquivo();
    erroDeArquivo.value = mensagemDeExtensaoInvalida(arquivo.name);
    return;
  }

  erroDeArquivo.value = '';
  curfile.name = arquivo.name;
  curfile.file = arquivo;
}

// trocar o tipo depois de escolher o arquivo pode torná-lo inválido
watch(extensoesPermitidas, () => {
  if (!curfile.file || arquivoTemExtensaoPermitida(curfile.file.name, extensoesPermitidas.value)) {
    erroDeArquivo.value = '';
    return;
  }

  erroDeArquivo.value = mensagemDeExtensaoInvalida(curfile.file.name);
  removerArquivo();
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h2>{{ title }}</h2>
    <hr class="ml2 f1">
    <button
      class="btn round ml2"
      @click="checkClose"
    >
      <svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg>
    </button>
  </div>
  <template v-if="!(singlePdm?.loading || singlePdm?.error) && singlePdm.id && !curfile?.loading">
    <Form
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      @submit="onSubmit"
    >
      <div class="flex g2">
        <div class="f1">
          <label class="label">Descrição <span class="tvermelho">*</span></label>
          <Field
            name="descricao"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.descricao }"
          />
          <div class="error-msg">
            {{ errors.descricao }}
          </div>
        </div>
        <div class="f1">
          <label class="label">Tipo de Documento <span class="tvermelho">*</span></label>
          <Field
            v-model="tipoDocumentoId"
            name="tipo_documento_id"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.tipo_documento_id, loading: chamadasPendentesDeTipos.lista }"
            :disabled="chamadasPendentesDeTipos.lista"
          >
            <option value="">
              Selecione
            </option>
            <option
              v-for="d in listaDeTiposDeDocumentos"
              :key="d.id"
              :value="d.id"
            >
              {{ d.titulo }}
            </option>
          </Field>
          <div class="error-msg">
            {{ errors.tipo_documento_id }}
          </div>
        </div>
      </div>

      <div class="flex g2 mb2">
        <div class="f1">
          <label class="label">Arquivo</label>

          <label
            v-if="!curfile.name"
            class="addlink"
            :class="{ 'error': errors.arquivo }"
            :aria-disabled="!tipoDocumentoId"
            :style="!tipoDocumentoId ? 'opacity: .5; cursor: not-allowed;' : undefined"
          ><svg
            width="20"
            height="20"
          ><use xlink:href="#i_+" /></svg><span>Selecionar arquivo<template
            v-if="extensoesPermitidas.length"
          > ({{ extensoesComoTexto(extensoesPermitidas) }})</template></span><input
            type="file"
            :accept="extensoesParaAccept(extensoesPermitidas)"
            :disabled="!tipoDocumentoId"
            :onchange="addFile"
            style="display:none;"
          ></label>

          <div v-else-if="curfile.name">
            <span>{{ curfile?.name?.slice(0, 30) }}</span> <a
              class="addlink"
              @click="removerArquivo"
            ><svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg></a>
          </div>

          <p
            v-if="!tipoDocumentoId && !curfile.name"
            class="t12 tc500 mt05"
          >
            Escolha um tipo de documento antes de selecionar o arquivo.
          </p>

          <Field
            v-model="curfile.file"
            name="arquivo"
            type="hidden"
          />
          <div class="error-msg">
            {{ erroDeArquivo || errors.arquivo }}
          </div>
        </div>
      </div>
      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </Form>
  </template>
  <template v-if="singlePdm?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="curfile?.loading">
    <span class="spinner">Enviando o arquivo</span>
  </template>
  <template v-if="singlePdm?.error || error">
    <div class="error p1">
      <div class="error-msg">
        {{ singlePdm.error ?? error }}
      </div>
    </div>
  </template>
</template>
