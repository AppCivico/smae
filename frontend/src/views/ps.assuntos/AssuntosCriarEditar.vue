<template>
  <MigalhasDePão class="mb1" />
  <div class="flex spacebetween center mb2">
    <h1> <span v-if="!assuntoId">Novo</span> Assunto</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
  <Form
    v-slot="{ errors, isSubmitting }"
    :validation-schema="schema"
    :initial-values="itemParaEdicao"
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
import { assunto as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useAssuntosStore } from '@/stores/assuntosPs.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  assuntoId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const assuntosStore = useAssuntosStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(assuntosStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = props.assuntoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values };

    if (route.params?.assuntoId) {
      response = await assuntosStore.salvarItem(
        dataToSend,
        route.params.assuntoId,
      );
    } else {
      response = await assuntosStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      assuntosStore.$reset();
      router.push({ name: 'assuntosListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

assuntosStore.$reset();
// não foi usada a prop.assuntoId pois estava vazando do edit na hora de criar uma nova
if (route.params?.assuntoId) {
  assuntosStore.buscarItem(route.params?.assuntoId);
}
</script>

<style></style>
