<template>
  <MigalhasDePão class="mb1" />
  <div class="flex spacebetween center mb2">
    <h1> <span v-if="!aditivoId">Novo</span> Aditivo</h1>
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
          class="mb0"
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
    <div class="f1 flex center f1 mb1">
      <Field
        name="habilita_valor"
        type="checkbox"
        :value="true"
        :unchecked-value="false"
        class="inputcheckbox mr1"
      />
      <LabelFromYup
        name="habilita_valor"
        :schema="schema"
        class="mb0"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="habilita_valor"
      />
    </div>
    <div class="f1 flex center">
      <Field
        name="habilita_valor_data_termino"
        type="checkbox"
        :value="true"
        :unchecked-value="false"
        class="inputcheckbox mr1"
      />
      <LabelFromYup
        name="habilita_valor_data_termino"
        :schema="schema"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="habilita_valor_data_termino"
      />
    </div>
    <div>
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
    </div>
  </Form>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erros.emFoco"
    class="error p1"
  >
    <div class="error-msg">
      {{ erros.emFoco }}
    </div>
  </div>
</template>

<script setup>
import { tipoDeAditivo as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useTipoDeAditivosStore } from '@/stores/tipoDeAditivos.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  aditivoId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const aditivosStore = useTipoDeAditivosStore();
const { chamadasPendentes, erros, itemParaEdicao } = storeToRefs(aditivosStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = props.aditivoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (route.params?.aditivoId) {
      response = await aditivosStore.salvarItem(
        values,
        route.params.aditivoId,
      );
    } else {
      response = await aditivosStore.salvarItem(values);
    }
    if (response) {
      alertStore.success(msg);
      aditivosStore.$reset();
      router.push({ name: 'tipoDeAditivosListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

aditivosStore.$reset();
// não foi usada a prop.aditivoId pois estava vazando do edit na hora de criar uma nova
if (route.params?.aditivoId) {
  aditivosStore.buscarItem(route.params?.aditivoId);
}
</script>

<style></style>
