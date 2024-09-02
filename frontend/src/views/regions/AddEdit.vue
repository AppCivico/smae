<script setup>
import { região as schema } from '@/consts/formSchemas';
import requestS from '@/helpers/requestS.ts';
import { router } from '@/router';
import { useAlertStore, useEditModalStore, useRegionsStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { reactive } from 'vue';
import { useRoute } from 'vue-router';

const baseUrl = `${import.meta.env.VITE_API_URL}`;
const props = defineProps(['props']);
const alertStore = useAlertStore();
const editModalStore = useEditModalStore();
const route = useRoute();
const {
  id, id2, id3, id4,
} = route.params;

const regionsStore = useRegionsStore();
regionsStore.clearEdit();
const { singleTempRegions } = storeToRefs(regionsStore);

let title1;
let title2;
let level;
let parentID;
let lastid;

const curfile = reactive({});

if (props.props.type == 'editar') {
  title1 = 'Editar';
  title2 = 'Município';
  level = 0;

  if (id) {
    title2 = 'Município';
    lastid = id;
    level += 1;
  }
  if (id2) {
    title2 = 'Região';
    lastid = id2;
    parentID = id;
    level += 1;
  }
  if (id3) {
    title2 = 'Subprefeitura';
    lastid = id3;
    parentID = id2;
    level += 1;
  }
  if (id4) {
    title2 = 'Distrito';
    lastid = id4;
    parentID = id3;
    level += 1;
  }

  regionsStore.getById(lastid);
  curfile.name = singleTempRegions.value.shapefile;
} else {
  title1 = 'Cadastro de';
  title2 = 'Município';
  level = 1;

  if (id) {
    title2 = 'Região';
    lastid = id;
    parentID = id;
    level += 1;
  }
  if (id2) {
    title2 = 'Subprefeitura';
    lastid = id2;
    parentID = id2;
    level += 1;
  }
  if (id3) {
    title2 = 'Distrito';
    lastid = id3;
    parentID = id3;
    level += 1;
  }
}

async function onSubmit(values) {
  try {
    let msg;
    let r;
    if (singleTempRegions.value.id) {
      r = await regionsStore.update(singleTempRegions.value.id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await regionsStore.insert(values);
      msg = 'Item adicionado com sucesso!';
    }
    if (r == true) {
      regionsStore.filterRegions();
      await router.push({
        name: 'gerenciarRegiões',
      });
      alertStore.success(msg);
      editModalStore.clear();
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    editModalStore.clear();
    alertStore.clear();
    router.push({
      name: 'gerenciarRegiões',
    });
  });
}
async function checkDelete(idDaRegião) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await regionsStore.delete(idDaRegião)) {
      regionsStore.filterRegions();
      editModalStore.clear();
      router.push({
        name: 'gerenciarRegiões',
      });
    }
  }, 'Remover');
}
function removeShapeFile() {
  curfile.name = '';
  curfile.loading = null;
  singleTempRegions.value.upload_shapefile = '';
}
async function uploadShapeFile(e) {
  curfile.name = '';
  curfile.loading = true;

  const { files } = e.target;
  const formData = new FormData();
  formData.append('tipo', 'SHAPEFILE');
  formData.append('arquivo', files[0]);

  try {
    const u = await requestS.upload(`${baseUrl}/upload`, formData);

    if (u.upload_token) {
      curfile.name = files[0].name;
      singleTempRegions.value.upload_shapefile = u.upload_token;
    }
  } catch (erro) {
    curfile.name = '';
    singleTempRegions.value.upload_shapefile = '';
  }

  curfile.loading = null;
}

singleTempRegions.value.nivel = level;
singleTempRegions.value.parente_id = parentID;
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h2>{{ title1 }} {{ title2 }}</h2>
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
  <template v-if="!(singleTempRegions?.loading || singleTempRegions?.error)">
    <Form
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      :initial-values="singleTempRegions"
      @submit="onSubmit"
    >
      <Field
        name="nivel"
        type="hidden"
        :value="level"
      /><div class="error-msg">
        {{ errors.nivel }}
      </div>
      <Field
        name="parente_id"
        type="hidden"
        :value="parentID"
      /><div class="error-msg">
        {{ errors.parente_id }}
      </div>

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
      </div>
      <div class="flex g2 mb2">
        <div class="f1">
          <label class="label">Shapefile</label>

          <label
            v-if="!curfile.loading && !curfile.name"
            class="addlink"
          ><svg
             width="20"
             height="20"
           ><use xlink:href="#i_+" /></svg>
            <span>
              Adicionar Arquivo .zip contendo os arquivos do shapefile (.shp, .dbf, .shx e .cpg) *
            </span>
            <input
              id="shapefile"
              type="file"
              accept=".kml,.geojson,.json,.shp,.zip"
              :onchange="uploadShapeFile"
              style="display:none;"
            ></label>

          <div
            v-else-if="curfile.loading"
            class="addlink"
          >
            <span>Carregando</span> <svg
              width="20"
              height="20"
            ><use xlink:href="#i_spin" /></svg>
          </div>

          <div v-else-if="curfile.name">
            <span>{{ curfile?.name?.slice(0,30) }}</span> <a
              :onclick="removeShapeFile"
              class="addlink"
            ><svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg></a>
          </div>
          <Field
            name="upload_shapefile"
            type="hidden"
            :value="curfile?.name"
          />
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
  <template v-if="singleTempRegions.id">
    <button
      class="btn amarelo big"
      @click="checkDelete(singleTempRegions.id)"
    >
      Remover item
    </button>
  </template>
  <template v-if="singleTempRegions?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="singleTempRegions?.error || error">
    <div class="error p1">
      <div class="error-msg">
        {{ singleTempRegions.error ?? error }}
      </div>
    </div>
  </template>
</template>
