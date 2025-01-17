<template>
  <MigalhasDePão class="mb1" />
  <header class="flex spacebetween center mb2">
    <TítuloDePágina />

    <hr class="ml2 f1">

    <CheckClose :formulario-sujo="formularioSujo" />
  </header>

  <Form
    v-slot="{ errors, isSubmitting }"
    :validation-schema="schema"
    :initial-values="categoriaParaEdicao"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="nome"
          :schema="schema"
        />
        <Field
          name="nome"
          type="text"
          min="3"
          max="250"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="nome"
        />
      </div>
    </div>
    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="
          Object.keys(errors)?.length
            ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
            : null
        "
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import {
  ErrorMessage, Field, Form, useIsFormDirty,
} from 'vee-validate';

import { categoriaAssunto as schema } from '@/consts/formSchemas';

import { useAlertStore } from '@/stores/alert.store';
import { useAssuntosStore } from '@/stores/assuntosPs.store';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  categoriaAssuntoId: {
    type: Number,
    default: 0,
  },
});

const formularioSujo = useIsFormDirty();

const alertStore = useAlertStore();
const assuntosStore = useAssuntosStore();

const {
  chamadasPendentes, erro, categoriaParaEdicao,
} = storeToRefs(assuntosStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = props.categoriaAssuntoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values };

    if (route.params?.categoriaAssuntoId) {
      response = await assuntosStore.salvarCategoria(
        dataToSend,
        route.params.categoriaAssuntoId,
      );
    } else {
      response = await assuntosStore.salvarCategoria(dataToSend);
    }

    if (response) {
      alertStore.success(msg);
      assuntosStore.$reset();
      router.push({ name: route.meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

assuntosStore.$reset();
// não foi usada a prop.categoriaAssuntoId pois estava vazando do edit na hora de criar uma nova
if (route.params?.categoriaAssuntoId) {
  assuntosStore.buscarCategoria(route.params?.categoriaAssuntoId);
}
</script>

<style></style>
