<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || "Etiquetas" }}</h1>
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
          name="descricao"
          :schema="schema"
        />
        <Field
          name="descricao"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="descricao"
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
import { etiqueta as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useEtiquetasStore } from '@/stores/etiquetaMdo.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  etiquetaId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const etiquetasStore = useEtiquetasStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(etiquetasStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = props.etiquetaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values };

    if (props.etiquetaId) {
      response = await etiquetasStore.salvarItem(
        dataToSend,
        props.etiquetaId,
      );
    } else {
      response = await etiquetasStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      etiquetasStore.$reset();
      router.push({ name: 'mdoEtiquetasListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

if (props.etiquetaId) {
  etiquetasStore.buscarItem(props.etiquetaId);
}
</script>

<style></style>
