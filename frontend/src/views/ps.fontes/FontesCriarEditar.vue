<template>
  <MigalhasDePão class="mb1" />
  <div class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <CheckClose :formulario-sujo="formularioSujo" />
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
          v-model="itemParaEdicao.nome"
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
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import {
  ErrorMessage, Field, Form, useIsFormDirty,
} from 'vee-validate';

import { fonte as schema } from '@/consts/formSchemas';

import { useFontesStore } from '@/stores/fontesPs.store';
import { useAlertStore } from '@/stores/alert.store';
import TituloDaPagina from '@/components/TituloDaPagina.vue';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  fonteId: {
    type: Number,
    default: 0,
  },
});

const formularioSujo = useIsFormDirty();

const alertStore = useAlertStore();
const fontesStore = useFontesStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(fontesStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = props.fonteId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values };

    if (route.params?.fonteId) {
      response = await fontesStore.salvarItem(
        dataToSend,
        route.params.fonteId,
      );
    } else {
      response = await fontesStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      fontesStore.$reset();
      router.push({ name: route.meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
}
onMounted(() => {
  if (props.fonteId) {
    fontesStore.$reset();
    fontesStore.buscarItem(props.fonteId);
  }
});
</script>
