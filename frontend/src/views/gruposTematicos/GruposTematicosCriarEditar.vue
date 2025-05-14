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
    </div>
    <p class="w700">
      Informações adicionais a serem incluídas no registro da obra:
    </p>

    <label
      for="programa_habitacional"
      class="flex center mb1"
    >
      <Field
        id="programa_habitacional"
        name="programa_habitacional"
        type="checkbox"
        :value="true"
        :unchecked-value="false"
      />
      <LabelFromYup
        as="span"
        name="programa_habitacional"
        :schema="schema"
        class="mb0"
      />
    </label>
    <label
      for="unidades_habitacionais"
      class="flex center mb1"
    >
      <Field
        id="unidades_habitacionais"
        name="unidades_habitacionais"
        type="checkbox"
        :value="true"
        :unchecked-value="false"
      />
      <LabelFromYup
        as="span"
        name="unidades_habitacionais"
        class="mb0"
        :schema="schema"
      />
    </label>
    <label
      for="familias_beneficiadas"
      class="flex center mb1"
    >
      <Field
        id="familias_beneficiadas"
        name="familias_beneficiadas"
        type="checkbox"
        :value="true"
        :unchecked-value="false"
      />
      <LabelFromYup
        as="span"
        name="familias_beneficiadas"
        :schema="schema"
        class="mb0"
      />
    </label>

    <label
      for="unidades_atendidas"
      class="flex center mb1"
    >
      <Field
        id="unidades_atendidas"
        name="unidades_atendidas"
        type="checkbox"
        :value="true"
        :unchecked-value="false"
      />
      <LabelFromYup
        as="span"
        name="unidades_atendidas"
        :schema="schema"
        class="mb0"
      />
    </label>

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
    v-if="erro.emFoco"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro.emfoco }}
    </div>
  </div>
</template>

<script setup>
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import { gruposTematicos as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useGruposTematicosStore } from '@/stores/gruposTematicos.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  grupoTematicoId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const gruposTematicosStore = useGruposTematicosStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(gruposTematicosStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = props.grupoTematicoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values };

    if (props.grupoTematicoId) {
      response = await gruposTematicosStore.salvarItem(
        dataToSend,
        props.grupoTematicoId,
      );
    } else {
      response = await gruposTematicosStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      gruposTematicosStore.$reset();
      router.push({ name: 'gruposTematicosObras' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

if (props.grupoTematicoId) {
  gruposTematicosStore.buscarItem(props.grupoTematicoId);
}
</script>

<style></style>
