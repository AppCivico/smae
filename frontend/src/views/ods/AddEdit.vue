<script setup>
import { Dashboard } from '@/components';
import { router } from '@/router';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { useRoute } from 'vue-router';
import * as Yup from 'yup';

import { useAlertStore, useODSStore } from '@/stores';

const alertStore = useAlertStore();
const route = useRoute();
const { id } = route.params;

const ODSStore = useODSStore();
const { tempODS } = storeToRefs(ODSStore);
ODSStore.clear();

let title = 'Cadastro de categoria';
if (id) {
  title = 'Editar categoria';
  ODSStore.getById(id);
}

const schema = Yup.object().shape({
  numero: Yup.number().required('Preencha o número'),
  titulo: Yup.string().required('Preencha o título'),
  descricao: Yup.string().required('Preencha a descrição'),
});

async function onSubmit(values) {
  try {
    let msg;
    let r;
    if (id && tempODS.value.id) {
      r = await ODSStore.update(tempODS.value.id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await ODSStore.insert(values);
      msg = 'Item adicionado com sucesso!';
    }
    if (r == true) {
      await router.push('/categorias');
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', '/categorias');
}
async function checkDelete(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => { if (await ODSStore.delete(id)) router.push('/categorias'); }, 'Remover');
}
</script>
<template>
  <Dashboard>
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
    <template v-if="!(tempODS?.loading || tempODS?.error)">
      <Form
        v-slot="{ errors, isSubmitting }"
        :validation-schema="schema"
        :initial-values="tempODS"
        @submit="onSubmit"
      >
        <div class="flex g2">
          <div class="f1">
            <label class="label">Número <span class="tvermelho">*</span></label>
            <Field
              name="numero"
              type="number"
              class="inputtext light mb1"
              :class="{ 'error': errors.numero }"
            />
            <div class="error-msg">
              {{ errors.numero }}
            </div>
          </div>
          <div class="f2">
            <label class="label">Título <span class="tvermelho">*</span></label>
            <Field
              name="titulo"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.titulo }"
            />
            <div class="error-msg">
              {{ errors.titulo }}
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
    <template v-if="tempODS.id">
      <button
        class="btn amarelo big"
        @click="checkDelete(tempODS.id)"
      >
        Remover item
      </button>
    </template>
    <template v-if="tempODS?.loading">
      <span class="spinner">Carregando</span>
    </template>
    <template v-if="tempODS?.error || error">
      <div class="error p1">
        <div class="error-msg">
          {{ tempODS.error ?? error }}
        </div>
      </div>
    </template>
  </Dashboard>
</template>
