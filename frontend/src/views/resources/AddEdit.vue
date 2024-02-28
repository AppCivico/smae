<script setup>
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useAlertStore, useResourcesStore } from '@/stores';

const alertStore = useAlertStore();
const route = useRoute();
const { id } = route.params;

const resourcesStore = useResourcesStore();
const { tempResources } = storeToRefs(resourcesStore);
resourcesStore.clear();

let title = 'Cadastro de unidade de medida';
if (id) {
  title = 'Editar unidade de medida';
  resourcesStore.getById(id);
}

const schema = Yup.object().shape({
  descricao: Yup.string().required('Preencha a descrição'),
  sigla: Yup.string().required('Preencha a sigla'),
});

async function onSubmit(values) {
  try {
    let msg;
    let r;
    if (id && tempResources.value.id) {
      r = await resourcesStore.updateType(tempResources.value.id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await resourcesStore.insertType(values);
      msg = 'Item adicionado com sucesso!';
    }
    if (r == true) {
      await router.push('/unidade-medida');
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', '/unidade-medida');
}
async function checkDelete(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => { if (await resourcesStore.deleteType(id)) router.push('/unidade-medida'); }, 'Remover');
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ title }}</h1>
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
  <template v-if="!(tempResources?.loading || tempResources?.error)">
    <Form
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      :initial-values="tempResources"
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
      </div>
      <div class="flex g2">
        <div class="f1">
          <label class="label">Sigla <span class="tvermelho">*</span></label>
          <Field
            name="sigla"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.sigla }"
          />
          <div class="error-msg">
            {{ errors.sigla }}
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
  <template v-if="tempResources.id && perm?.CadastroUnidadeMedida?.remover">
    <button
      class="btn amarelo big"
      @click="checkDelete(tempResources.id)"
    >
      Remover item
    </button>
  </template>
  <template v-if="tempResources?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="tempResources?.error || error">
    <div class="error p1">
      <div class="error-msg">
        {{ tempResources.error ?? error }}
      </div>
    </div>
  </template>
</template>
