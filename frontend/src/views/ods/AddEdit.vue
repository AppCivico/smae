<script setup>
import * as Yup from 'yup';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { Field, Form, useIsFormDirty } from 'vee-validate';

import { router } from '@/router';
import { useAlertStore, useODSStore } from '@/stores';

import { Dashboard } from '@/components';
import CheckClose from '@/components/CheckClose.vue';
import MigalhasDePao from '@/components/MigalhasDePao.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';

const route = useRoute();
const ODSStore = useODSStore();
const alertStore = useAlertStore();
const formularioSujo = useIsFormDirty();

const { id } = route.params;
const { tempODS } = storeToRefs(ODSStore);

ODSStore.clear();
if (id) {
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

    if (r === true) {
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
    <MigalhasDePao />

    <div class="flex spacebetween center mb2 mt2">
      <TituloDaPagina />

      <hr class="ml2 f1">

      <CheckClose :formulario-sujo="formularioSujo" />
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
