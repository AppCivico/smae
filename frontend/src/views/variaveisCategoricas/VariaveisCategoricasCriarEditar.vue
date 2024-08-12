<template>
  <MigalhasDePão class="mb1" />
  <div class="flex spacebetween center mb2">
    <h1> <span v-if="!variavelId">Novo</span> Tipo de variavel categorica</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
  <Form
    v-slot="{ errors, isSubmitting }"
    :validation-schema="schema"
    :initial-values="itemParaEdição"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="titulo"
          :schema="schema"
        />
        <Field
          name="titulo"
          type="text"
          min="3"
          max="256"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="titulo"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="tipo"
          :schema="schema"
        />
        <Field
          name="tipo"
          as="select"
          min="3"
          max="250"
          class="inputtext light mb1"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item, index in tipoDeVariaveisCategoricas"
            :key="index"
            :value="item.valor"
          >
            {{ item.nome }}
          </option>
        </Field>

        <ErrorMessage
          class="error-msg mb1"
          name="tipo"
        />
      </div>
    </div>
    <div>
      <LabelFromYup
        name="descricao"
        :schema="schema"
      />
      <Field
        name="descricao"
        type="text"
        min="3"
        max="2048"
        class="inputtext light mb1"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="descricao"
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
import { useRoute, useRouter } from 'vue-router';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useVariaveisCategoricasStore } from '@/stores/variaveisCategoricas.store';
import { useAlertStore } from '@/stores/alert.store';
import { variávelCategórica as schema } from '@/consts/formSchemas';
import tipoDeVariaveisCategoricas from '@/consts/tipoDeVariaveisCategoricas';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  variavelId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const variaveisCategoricasStore = useVariaveisCategoricasStore();
const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(variaveisCategoricasStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = props.variavelId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values };

    if (route.params?.variavelId) {
      response = await variaveisCategoricasStore.salvarItem(
        dataToSend,
        route.params.variavelId,
      );
    } else {
      response = await variaveisCategoricasStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      variaveisCategoricasStore.$reset();
      router.push({ name: 'variaveisCategoricasListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

variaveisCategoricasStore.$reset();
// não foi usada a prop.variavelId pois estava vazando do edit na hora de criar uma nova
if (route.params?.variavelId) {
  variaveisCategoricasStore.buscarItem(route.params?.variavelId);
}
</script>

<style></style>
