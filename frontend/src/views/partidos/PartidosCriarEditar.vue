<script setup>
import { partido as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  partidoId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const partidosStore = usePartidosStore();
const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(partidosStore);

async function onSubmit(values) {
  try {
    let r;
    const msg = props.partidoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = {
      ...values,
      numero: Number.parseInt(values.numero, 10),
      encerramento: values.encerramento || null,
      fundacao: values.fundacao || null,
    };

    if (props.partidoId) {
      r = await partidosStore.salvarItem(dataToSend, props.partidoId);
    } else {
      r = await partidosStore.salvarItem(dataToSend);
    }
    if (r) {
      alertStore.success(msg);
      partidosStore.$reset();
      router.push({ name: 'partidosListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

if (props.partidoId) {
  partidosStore.buscarItem(props.partidoId);
}

</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Partido' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
  <Form
    v-slot="{ errors, isSubmitting, }"
    :validation-schema="schema"
    :initial-values="itemParaEdição"
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
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="sigla"
          :schema="schema"
        />
        <Field
          name="sigla"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="sigla"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="numero"
          :schema="schema"
        />
        <Field
          name="numero"
          type="number"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="numero"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="observacao"
          :schema="schema"
        />
        <Field
          name="observacao"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="observacao"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="fundacao"
          :schema="schema"
        />
        <Field
          name="fundacao"
          type="date"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="fundacao"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="encerramento"
          :schema="schema"
        />
        <Field
          name="encerramento"
          type="date"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="encerramento"
        />
      </div>
    </div>
    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
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
