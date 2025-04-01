<template>
  <div class="flex spacebetween center mb2">
    <TituloDaPagina />
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
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="nome"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="conceito"
          :schema="schema"
        />
        <Field
          name="conceito"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="conceito"
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
    v-if="erro.length"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>

<script setup>
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import { tipoDeIntervencao as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useTiposDeIntervencaoStore } from '@/stores/tiposDeIntervencao.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const alertStore = useAlertStore();
const tiposDeIntervencaoStore = useTiposDeIntervencaoStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(tiposDeIntervencaoStore);
const router = useRouter();
const route = useRoute();
const props = defineProps({
  intervencaoId: {
    type: Number,
    default: 0,
  },
});

async function onSubmit(values) {
  try {
    let response;
    const msg = props.intervencaoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values };

    if (props.intervencaoId) {
      response = await tiposDeIntervencaoStore.salvarItem(
        dataToSend,
        props.intervencaoId,
      );
    } else {
      response = await tiposDeIntervencaoStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      tiposDeIntervencaoStore.$reset();
      router.push({ name: 'tiposDeIntervencao' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

if (props.intervencaoId) {
  tiposDeIntervencaoStore.buscarItem(props.intervencaoId);
}
</script>

<style></style>
