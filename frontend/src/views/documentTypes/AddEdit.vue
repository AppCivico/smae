<script setup>
import * as Yup from 'yup';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { Field, Form, useIsFormDirty } from 'vee-validate';

import { Dashboard } from '@/components';
import MigalhasDePao from '@/components/MigalhasDePao.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import CheckClose from '@/components/CheckClose.vue';

import { router } from '@/router';
import { useAlertStore } from '@/stores/alert.store';
import { useDocumentTypesStore } from '@/stores/documentTypes.store';

const route = useRoute();
const alertStore = useAlertStore();
const formularioSujo = useIsFormDirty();
const documentTypesStore = useDocumentTypesStore();

const { id } = route.params;

const { tempDocumentTypes } = storeToRefs(documentTypesStore);
documentTypesStore.clear();

if (id) {
  documentTypesStore.getById(id);
}

const schema = Yup.object().shape({
  codigo: Yup.string().required('Preencha o código'),
  titulo: Yup.string().required('Preencha o tipo'),
  descricao: Yup.string().required('Preencha a descrição'),
  extensoes: Yup.string().required('Preencha a extensões').matches(/^[a-zA-Z0-9,]*$/, 'Somente letras, números e vírgula.'),
});

async function onSubmit(values) {
  try {
    let msg;
    let r;
    if (id && tempDocumentTypes.value.id) {
      r = await documentTypesStore.update(tempDocumentTypes.value.id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await documentTypesStore.insert(values);
      msg = 'Item adicionado com sucesso!';
    }

    if (r === true) {
      alertStore.success(msg);
      await router.push({ name: route.meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function removeChars(x) {
  x.target.value = x.target.value.replace(/[^a-zA-Z0-9,]/g, '');
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

    <template v-if="!(tempDocumentTypes?.loading || tempDocumentTypes?.error)">
      <Form
        v-slot="{ errors, isSubmitting }"
        :validation-schema="schema"
        :initial-values="tempDocumentTypes"
        @submit="onSubmit"
      >
        <div class="flex g2">
          <div class="f1">
            <label class="label">Código <span class="tvermelho">*</span></label>
            <Field
              name="codigo"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.codigo }"
            />
            <div class="error-msg">
              {{ errors.codigo }}
            </div>
          </div>
          <div class="f1">
            <label class="label">Tipo <span class="tvermelho">*</span></label>
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
          <div class="f1">
            <label class="label">Extensões <span class="tvermelho">*</span></label>
            <Field
              name="extensoes"
              type="text"
              class="inputtext light mb1"
              placeholder="Liste aqui as extensões aceitas"
              :class="{ 'error': errors.extensoes }"
              @keyup="removeChars"
            />
            <div class="error-msg">
              {{ errors.extensoes }}
            </div>
            <p class="t13 tc500">
              Separe as extensões por vírgula (ex: pdf,jpg,xls)
            </p>
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

    <template v-if="tempDocumentTypes?.loading">
      <span class="spinner">Carregando</span>
    </template>
    <template v-if="tempDocumentTypes?.error || error">
      <div class="error p1">
        <div class="error-msg">
          {{ tempDocumentTypes.error ?? error }}
        </div>
      </div>
    </template>
  </Dashboard>
</template>
