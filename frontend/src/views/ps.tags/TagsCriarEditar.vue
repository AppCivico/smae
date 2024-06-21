<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || "Tags" }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
  <pre v-ScrollLockDebug>odsListas:{{ odsLista }}</pre>

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
import { tag as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useTagsStore } from '@/stores/tags.store';
import { useOdsStore } from '@/stores/odsPs.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const props = defineProps({
  tagId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const tagsStore = useTagsStore();
const odsStore = useOdsStore();

const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(tagsStore);
const { lista: odsLista, chamadasPendentes: odsChamadasPendentes, erro: odsErro } = storeToRefs(odsStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = props.tagId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values, pdm_id: Number(route.params.planoSetorialId) };

    if (route.params?.temaId) {
      response = await tagsStore.salvarItem(
        dataToSend,
        route.params?.tagId,
      );
    } else {
      response = await tagsStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      tagsStore.$reset();
      router.push({ name: 'planosSetoriaisTags' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}
if (props.tagId) {
  tagsStore.buscarItem(props.tagId);
}

odsStore.buscarTudo();
</script>

<style></style>
