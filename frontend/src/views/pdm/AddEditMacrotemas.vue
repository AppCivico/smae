<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import {
  useAlertStore, useEditModalStore, useMacrotemasStore, usePdMStore, useMetasStore,
} from '@/stores';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const { id } = route.params;

const MacrotemasStore = useMacrotemasStore();
const { tempMacrotemas } = storeToRefs(MacrotemasStore);
MacrotemasStore.clear();

const props = defineProps(['props']);

const virtualParent = reactive({});
const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);

let pdm_id = reactive(0);
const PdMStore = usePdMStore();
const { singlePdm } = storeToRefs(PdMStore);

if (props.props.parentPage == 'metas') {
  Promise.all([
    MetasStore.getPdM(),
  ]).then(() => {
    pdm_id = activePdm.value.id;
    virtualParent.pdm_id = pdm_id;
  });
} else {
  pdm_id = route.params.pdm_id;
  if (!singlePdm.value.id || singlePdm.value.id != pdm_id) PdMStore.getById(pdm_id);
  virtualParent.pdm_id = pdm_id;
}

const label = ref('');
let title = 'Cadastrar';
if (id) {
  title = 'Editar';
  MacrotemasStore.getById(id);
}

const schema = Yup.object().shape({
  descricao: Yup.string().required('Preencha a descrição'),
  pdm_id: Yup.string(),
});

onMounted(() => {
  if (props.props.parentPage == 'metas') {
    label.value = activePdm.value.rotulo_macro_tema ?? 'Macrotema';
  } else {
    label.value = singlePdm.value.rotulo_macro_tema ?? 'Macrotema';
  }
});

async function onSubmit(values) {
  try {
    let msg;
    let r;
    if (id && tempMacrotemas.value.id) {
      r = await MacrotemasStore.update(tempMacrotemas.value.id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await MacrotemasStore.insert(values);
      msg = 'Item adicionado com sucesso!';
    }
    if (r == true) {
      MacrotemasStore.clear();
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
    if (await MacrotemasStore.delete(id)) {
      MacrotemasStore.clear();
      PdMStore.clearLoad();
      if (props.props.parentPage == 'pdm') PdMStore.filterPdM();
      editModalStore.clear();
      router.push(`/${props.props.parentPage}`);
    }
  }, 'Remover');
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h2>{{ title }} {{ label }}</h2>
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
  <template v-if="!(tempMacrotemas?.loading || tempMacrotemas?.error)">
    <Form
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      :initial-values="id ? tempMacrotemas : virtualParent"
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
          <label class="label">{{ label }} <span class="tvermelho">*</span></label>
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
  <template v-if="tempMacrotemas.id">
    <button
      class="btn amarelo big"
      @click="checkDelete(tempMacrotemas.id)"
    >
      Remover item
    </button>
  </template>
  <template v-if="tempMacrotemas?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="tempMacrotemas?.error || error">
    <div class="error p1">
      <div class="error-msg">
        {{ tempMacrotemas.error ?? error }}
      </div>
    </div>
  </template>
</template>
