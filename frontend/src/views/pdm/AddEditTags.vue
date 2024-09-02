<script setup>
import { tag as schema } from '@/consts/formSchemas';
import requestS from '@/helpers/requestS.ts';
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { reactive } from 'vue';
import { useRoute } from 'vue-router';

import {
  useAlertStore, useEditModalStore,
  useMetasStore,
  useODSStore,
  usePdMStore,
  useTagsStore,
} from '@/stores';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const { id } = route.params;

const TagsStore = useTagsStore();
const { tempTags } = storeToRefs(TagsStore);
TagsStore.clear();

const props = defineProps(['props']);

const virtualParent = reactive({});
const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);

const ODSStore = useODSStore();
const { ODS } = storeToRefs(ODSStore);
ODSStore.getAll();

let pdm_id = reactive(0);
const PdMStore = usePdMStore();
const { singlePdm } = storeToRefs(PdMStore);

const curfile = reactive({});

if (props.props.parentPage == 'metas') {
  Promise.all([
    MetasStore.getPdM(),
  ]).then(() => {
    pdm_id = activePdm.value.id;
    virtualParent.pdm_id = pdm_id;
  });
} else {
  pdm_id = route.params.pdm_id;
  virtualParent.pdm_id = pdm_id;
  if (!singlePdm.value.id || singlePdm.value.id != pdm_id) PdMStore.getById(pdm_id);
}

let title = 'Cadastro de Tag';
if (id) {
  title = 'Editar Tag';
  (async () => {
    await TagsStore.getById(id);
    if (tempTags.value.icone) curfile.name = tempTags.value.icone;
  })();
}

async function onSubmit(values) {
  try {
    let msg;
    let r;

    values.ods_id = values.ods_id ?? null;

    if (id && tempTags.value.id) {
      r = await TagsStore.update(tempTags.value.id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await TagsStore.insert(values);
      msg = 'Item adicionado com sucesso!';
    }
    if (r == true) {
      TagsStore.clear();
      PdMStore.clearLoad();
      if (props.props.parentPage == 'pdm') PdMStore.filterPdM();
      await router.push(`/${props.props.parentPage}`);
      alertStore.success(msg);
      editModalStore.clear();
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    router.push(`/${props.props.parentPage}`);
    editModalStore.clear();
    alertStore.clear();
  });
}
async function checkDelete(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await TagsStore.delete(id)) {
      TagsStore.clear();
      PdMStore.clearLoad();
      if (props.props.parentPage == 'pdm') PdMStore.filterPdM();
      editModalStore.clear();
      router.push(`/${props.props.parentPage}`);
    }
  }, 'Remover');
}
function removeshape() {
  curfile.name = '';
  curfile.loading = null;
  tempTags.value.upload_icone = curfile.name;
}
async function uploadshape(e) {
  curfile.name = '';
  curfile.loading = true;

  const { files } = e.target;
  const formData = new FormData();
  formData.append('tipo', 'ICONE_TAG');
  formData.append('arquivo', files[0]);

  const u = await requestS.upload(`${baseUrl}/upload`, formData);
  if (u.upload_token) {
    curfile.name = u.upload_token;
    curfile.loading = null;
    tempTags.value.upload_icone = curfile.name;
  }
}
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
  <template v-if="!(tempTags?.loading || tempTags?.error)">
    <Form
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      :initial-values="id ? tempTags : virtualParent"
      @submit="onSubmit"
    >
      <Field
        name="pdm_id"
        type="hidden"
        :value="pdm_id"
      /><div class="error-msg">
        {{ errors.pdm_id }}
      </div>
      <div class="flex g2">
        <div class="f1">
          <label class="label">Categoria&nbsp;<span class="tvermelho">*</span></label>
          <Field
            name="ods_id"
            as="select"
            class="inputtext light mb1"
            :class="{ 'error': errors.ods_id }"
          >
            <option value="">
              Selecionar
            </option>
            <template v-if="ODS.length">
              <option
                v-for="tipo in ODS"
                :key="tipo.id"
                :value="tipo.id"
                :selected="ods_id && tipo.id == ods_id"
              >
                {{ tipo.titulo }}
              </option>
            </template>
          </Field>
          <div class="error-msg">
            {{ errors.ods_id }}
          </div>
        </div>
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

      <div class="mt1 mb2">
        <label class="label tc300">Ícone</label>

        <label
          v-if="!curfile.loading && !curfile.name"
          class="addlink"
        ><svg
           width="20"
           height="20"
         ><use xlink:href="#i_+" /></svg>
          <span>
            Adicionar arquivo (formatos SVG ou PNG até 2mb)&nbsp;<span class="tvermelho">*</span>
          </span>
          <input
            type="file"
            accept=".svg,.png"
            :onchange="uploadshape"
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
          <img
            v-if="tempTags.icone == curfile?.name"
            :src="`${baseUrl}/download/${tempTags.icone}?inline=true`"
            width="100"
            class="ib mr1"
          >
          <span v-else>{{ curfile?.name?.slice(0, 30) }}</span>
          <a
            :onclick="removeshape"
            class="addlink"
          ><svg
            width="20"
            height="20"
          ><use xlink:href="#i_remove" /></svg></a>
        </div>
        <Field
          name="upload_icone"
          type="hidden"
          :value="curfile?.name"
        />
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
  <template v-if="tempTags.id">
    <button
      class="btn amarelo big"
      @click="checkDelete(tempTags.id)"
    >
      Remover item
    </button>
  </template>
  <template v-if="tempTags?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="tempTags?.error || error">
    <div class="error p1">
      <div class="error-msg">
        {{ tempTags.error ?? error }}
      </div>
    </div>
  </template>
</template>
