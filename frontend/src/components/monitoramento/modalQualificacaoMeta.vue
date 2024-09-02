<script setup>
import requestS from '@/helpers/requestS.ts';
import {
  useAlertStore, useCiclosStore, useDocumentTypesStore, useEditModalStore,
} from '@/stores';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { ref } from 'vue';
import * as Yup from 'yup';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const documentTypesStore = useDocumentTypesStore();
const { tempDocumentTypes } = storeToRefs(documentTypesStore);
documentTypesStore.clear();
documentTypesStore.filterDocumentTypes();

const pr = defineProps(['props']);
const { props } = pr;

const CiclosStore = useCiclosStore();
const { SingleMetaAnalise, SingleMetaAnaliseDocs } = storeToRefs(CiclosStore);

async function getAnaliseData() {
  await CiclosStore.getMetaAnalise(props.ciclo_id, props.meta_id);
}
getAnaliseData();

const schema = Yup.object().shape({
  informacoes_complementares: Yup.string(),
});

async function onSubmit(values) {
  try {
    let msg;
    let r;

    const v = {
      ciclo_fisico_id: props.ciclo_id,
      meta_id: props.meta_id,
      informacoes_complementares: values.informacoes_complementares || '',
    };
    r = await CiclosStore.updateMetaAnalise(v);
    msg = 'Análise qualitativa salva com sucesso!';
    if (r == true) {
      editModalStore.clear();
      alertStore.success(msg);
      getAnaliseData();
    }
  } catch (error) {
    alertStore.error(error);
  }
}

const virtualUpload = ref({});
const uploadSchema = Yup.object().shape({
  descricao: Yup.string().required('Preencha a descrição'),
  tipo_documento_id: Yup.string().nullable(),
  arquivo: Yup.string().required('Selecione um arquivo'),
});
async function addArquivo(values) {
  try {
    let msg;
    let r;

    virtualUpload.value.loading = true;
    values.tipo = 'DOCUMENTO';
    const formData = new FormData();

    Object.entries(values).forEach((x) => {
      formData.append(x[0], x[1]);
    });

    const u = await requestS.upload(`${baseUrl}/upload`, formData);
    if (u.upload_token) {
      r = await CiclosStore.addMetaArquivo({
        ciclo_fisico_id: props.ciclo_id,
        meta_id: props.meta_id,
        upload_token: u.upload_token,
      }, { ...values, ...u });
      if (r === true) {
        msg = 'Item adicionado com sucesso!';
        alertStore.success(msg);
        virtualUpload.value = {};
      }
    } else {
      virtualUpload.value.loading = false;
    }
  } catch (error) {
    alertStore.error(error);
    virtualUpload.value.loading = false;
  }
}
function deleteArquivo(id) {
  alertStore.confirmAction('Deseja remover o arquivo?', () => {
    CiclosStore.deleteMetaArquivo(id);
  }, 'Remover');
}
function addFile(e) {
  const { files } = e.target;
  virtualUpload.value.name = files[0].name;
  virtualUpload.value.file = files[0];
}

</script>
<template>
  <div class="flex spacebetween center">
    <h1>Qualificar meta</h1>
    <hr class="ml2 f1">
    <span>
      <button
        class="btn round ml2"
        @click="props.checkClose"
      ><svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg></button>
    </span>
  </div>

  <template v-if="!SingleMetaAnalise?.loading&&!SingleMetaAnalise?.error&&!error">
    <div class="t24 mb2">
      {{ props.parent.codigo }} - {{ props.parent.titulo }}
    </div>

    <Form
      ref="varForm"
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      :initial-values="SingleMetaAnalise"
      @submit="onSubmit"
    >
      <div class="mb2">
        <label class="label">Informações complementares</label>
        <Field
          name="informacoes_complementares"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          :class="{ 'error': errors.informacoes_complementares }"
        />
        <div class="error-msg">
          {{ errors.informacoes_complementares }}
        </div>
      </div>

      <table class="tablemain mb1">
        <thead>
          <tr>
            <th style="width: 30%">
              Documento
            </th>
            <th style="width: 60%">
              Descrição
            </th>
            <th style="width: 10%" />
          </tr>
        </thead>
        <tbody>
          <template
            v-for="subitem in SingleMetaAnaliseDocs"
            :key="subitem.id"
          >
            <tr>
              <td>
                <a
                  v-if="subitem?.arquivo?.download_token"
                  :href="baseUrl + '/download/' + subitem?.arquivo?.download_token"
                  download
                >{{ subitem?.arquivo?.nome_original ?? '-' }}</a>
                <template v-else>
                  {{ subitem?.arquivo?.nome_original ?? '-' }}
                </template>
              </td>
              <td>
                <a
                  v-if="subitem?.arquivo?.download_token"
                  :href="baseUrl + '/download/' + subitem?.arquivo?.download_token"
                  download
                >{{ subitem?.arquivo?.descricao ?? '-' }}</a>
                <template v-else>
                  {{ subitem?.arquivo?.descricao ?? '-' }}
                </template>
              </td>
              <td style="white-space: nowrap; text-align: right;">
                <button
                  v-if="subitem.id"
                  type="button"
                  class="like-a__text tprimary"
                  @click="deleteArquivo(subitem.id)"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_remove" /></svg>
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <a
        class="addlink mb1"
        @click="virtualUpload.open=1;"
      ><svg
        width="20"
        height="20"
      ><use xlink:href="#i_+" /></svg> <span>Adicionar documentos</span></a>

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          ref="submitBt"
          type="submit"
          class="btn big"
          :disabled="isSubmitting"
        >
          Qualificar meta
        </button>
        <hr class="ml2 f1">
      </div>
    </Form>

    <div
      v-if="virtualUpload.open"
      class="editModal-wrap"
    >
      <div
        class="overlay"
        @click="virtualUpload.open=false"
      />
      <div class="editModal">
        <div>
          <h3 class="mb2">
            Upload de arquivo
          </h3>
          <template v-if="virtualUpload?.loading">
            <span class="spinner">Enviando o arquivo</span>
          </template>
          <Form
            v-else
            v-slot="{ errors, isSubmitting }"
            :validation-schema="uploadSchema"
            @submit="addArquivo"
          >
            <div class="flex g2">
              <div class="f1">
                <label class="label">Descrição <span class="tvermelho">*</span></label>
                <Field
                  v-model="virtualUpload.descricao"
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
                  v-model="virtualUpload.tipo_documento_id"
                  name="tipo_documento_id"
                  as="select"
                  class="inputtext light mb1"
                  :class="{ 'error': errors.tipo_documento_id }"
                >
                  <option value="">
                    Selecione
                  </option>
                  <option
                    v-for="d in tempDocumentTypes"
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
                  v-if="!virtualUpload.name"
                  class="addlink"
                  :class="{ 'error': errors.arquivo }"
                ><svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_+" /></svg><span>Selecionar arquivo</span><input
                  type="file"
                  :onchange="addFile"
                  style="display:none;"
                ></label>

                <div v-else-if="virtualUpload.name">
                  <span>{{ virtualUpload?.name?.slice(0,30) }}</span> <a
                    class="addlink"
                    @click="virtualUpload.name=''"
                  ><svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_remove" /></svg></a>
                </div>
                <Field
                  v-model="virtualUpload.file"
                  name="arquivo"
                  type="hidden"
                />
                <div class="error-msg">
                  {{ errors.arquivo }}
                </div>
              </div>
            </div>
            <div class="flex spacebetween center">
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
        </div>
      </div>
    </div>
  </template>
  <template v-if="SingleMetaAnalise?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="SingleMetaAnalise?.error||error">
    <div class="error p1">
      <div class="error-msg">
        {{ SingleMetaAnalise.error??error }}
      </div>
    </div>
  </template>
</template>
