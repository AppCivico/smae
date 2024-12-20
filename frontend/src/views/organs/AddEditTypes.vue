<script setup>
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { router } from '@/router';
import { Dashboard } from '@/components';
import { useAlertStore, useOrgansStore } from '@/stores';
import MigalhasDePao from '@/components/MigalhasDePao.vue';

const alertStore = useAlertStore();
const route = useRoute();
const { id } = route.params;

const organsStore = useOrgansStore();
const { tempOrganTypes } = storeToRefs(organsStore);
organsStore.clear();

let title = 'Cadastro de tipo de orgão';
if (id) {
  title = 'Editar tipo de orgão';
  organsStore.getByIdTypes(id);
}

const schema = Yup.object().shape({
  descricao: Yup.string().required('Preencha a descrição'),
});

async function onSubmit(values) {
  try {
    let msg;
    let r;
    if (id && tempOrganTypes.value.id) {
      r = await organsStore.updateType(tempOrganTypes.value.id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await organsStore.insertType(values);
      msg = 'Orgão adicionado com sucesso!';
    }
    if (r === true) {
      await router.push('/orgaos/tipos');
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', '/orgaos/tipos');
}
</script>

<template>
  <Dashboard>
    <MigalhasDePao class="mb1" />

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
    <template v-if="!(tempOrganTypes?.loading || tempOrganTypes?.error)">
      <Form
        v-slot="{ errors, isSubmitting }"
        :validation-schema="schema"
        :initial-values="tempOrganTypes"
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

    <template v-if="tempOrganTypes?.loading">
      <span class="spinner">Carregando</span>
    </template>

    <template v-if="tempOrganTypes?.error || error">
      <div class="error p1">
        <div class="error-msg">
          {{ tempOrganTypes.error ?? error }}
        </div>
      </div>
    </template>
  </Dashboard>
</template>
