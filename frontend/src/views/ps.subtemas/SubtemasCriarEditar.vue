<template>
  <div class="flex spacebetween center mb2">
    <h1> <span v-if="!subtemaId">Novo</span> {{ titulo || "Subtema" }}</h1>
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
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { computed, defineOptions } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSubtemasPsStore } from '@/stores/subtemasPs.store';
import { useAlertStore } from '@/stores/alert.store';
import { subtema as schema } from '@/consts/formSchemas';

defineOptions({
  inheritAttrs: false,
});

const router = useRouter();
const route = useRoute();
const props = defineProps({
  subtemaId: {
    type: Number,
    default: 0,
  },
});

const titulo = typeof route?.meta?.título === 'function'
  ? computed(() => route.meta.título())
  : route?.meta?.título;

const alertStore = useAlertStore();
const subtemasStore = useSubtemasPsStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(subtemasStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = props.subtemaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values, pdm_id: Number(route.params.planoSetorialId) };

    if (route.params?.subtemaId) {
      response = await subtemasStore.salvarItem(
        dataToSend,
        route.params?.subtemaId,
      );
    } else {
      response = await subtemasStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      subtemasStore.$reset();
      router.push({ name: `${route.meta.entidadeMãe}.planosSetoriaisSubtemas` });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

subtemasStore.$reset();
// não foi usada a prop.subtemaId pois estava vazando do edit na hora de criar uma nova
if (route.params?.subtemaId) {
  subtemasStore.buscarItem(route.params?.subtemaId);
}
</script>

<style></style>
