<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || "Equipamentos" }}</h1>
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
    v-if="erro.emfoco"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro.emfoco }}
    </div>
  </div>
</template>

<script setup>
import { equipamento as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useEquipamentosStore } from '@/stores/equipamentos.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  equipamentoId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const equipamentosStore = useEquipamentosStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(equipamentosStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = props.equipamentoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values };

    if (props.equipamentoId) {
      response = await equipamentosStore.salvarItem(
        dataToSend,
        props.equipamentoId,
      );
    } else {
      response = await equipamentosStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      equipamentosStore.$reset();
      router.push({ name: 'equipamentosLista' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

if (props.equipamentoId) {
  equipamentosStore.buscarItem(props.equipamentoId);
}
</script>

<style></style>
