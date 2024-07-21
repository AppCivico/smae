<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || "Empreendimentos" }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
  <Form
    v-slot="{ errors, isSubmitting }"
    :validation-schema="schema"
    :initial-values="itemParaEdição"
    @submit="onSubmit"
  >
    <div>
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
    <div>
      <LabelFromYup
        name="identificador"
        :schema="schema"
      />
      <Field
        name="identificador"
        type="text"
        class="inputtext light mb1"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="identificador"
      />
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
import { useRoute, useRouter } from 'vue-router';
import { empreendtimentos as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useEmpreendimentosStore } from '@/stores/empreendimentos.store';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  empreendimentoId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const empreendimentosStore = useEmpreendimentosStore();
const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(empreendimentosStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = props.empreendimentoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values };

    if (props.empreendimentoId) {
      response = await empreendimentosStore.salvarItem(
        dataToSend,
        props.empreendimentoId,
      );
    } else {
      response = await empreendimentosStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      empreendimentosStore.$reset();
      router.push({ name: 'empreendimentosListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

if (props.empreendimentoId) {
  empreendimentosStore.buscarItem(props.empreendimentoId);
}
</script>

<style></style>
