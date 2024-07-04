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
    <div>
      <LabelFromYup
        name="habilita_valor"
        :schema="schema"
      />
      <Field
        name="habilita_valor"
        type="checkbox"
        :value="true"
        :unchecked-value="false"
        class="inputcheckbox"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="habilita_valor"
      />
    </div>
    <div>
      <LabelFromYup
        name="habilita_valor_data_termino"
        :schema="schema"
      />
      <Field
        name="habilita_valor_data_termino"
        type="checkbox"
        :value="true"
        :unchecked-value="false"
        class="inputcheckbox"
      />
      <ErrorMessage
        class="error-msg mb1"
        name="habilita_valor_data_termino"
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
import { useTipoDeAditivosStore } from '@/stores/tipoDeAditivosPs.store';
import { useAlertStore } from '@/stores/alert.store';
import { tipoDeAditivo as schema } from '@/consts/formSchemas';

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
const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(aditivosStore);

async function onSubmit(values) {
  console.log('values', values);
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
      router.push({ name: 'aditivosListar' });
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
