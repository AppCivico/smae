<script setup>
import * as Yup from 'yup';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { Field, Form, useIsFormDirty } from 'vee-validate';
import { router } from '@/router';

import { Dashboard } from '@/components';
import TituloDaPagina from '@/components/TituloDaPagina.vue';

import { useAlertStore } from '@/stores/alert.store';
import { useResourcesStore } from '@/stores/resources.store';

const formularioSujo = useIsFormDirty();

const alertStore = useAlertStore();
const route = useRoute();
const { id } = route.params;

const resourcesStore = useResourcesStore();
const { tempResources } = storeToRefs(resourcesStore);
resourcesStore.clear();

if (id) {
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

    if (r) {
      await router.push({ name: route.meta.rotaDeEscape });
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}
</script>

<template>
  <Dashboard>
    <MigalhasDePão />

    <div class="flex spacebetween center mb2 mt2">
      <TituloDaPagina />

      <hr class="ml2 f1">

      <CheckClose :formulario-sujo="formularioSujo" />
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
  </Dashboard>
</template>
