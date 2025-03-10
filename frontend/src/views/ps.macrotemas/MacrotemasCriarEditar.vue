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
import { useMacrotemasPsStore } from '@/stores/macrotemasPs.store';
import { useAlertStore } from '@/stores/alert.store';
import { macrotema as schema } from '@/consts/formSchemas';
import TituloDaPagina from '@/components/TituloDaPagina.vue';

defineOptions({
  inheritAttrs: false,
});

const router = useRouter();
const route = useRoute();
const props = defineProps({
  macrotemaId: {
    type: Number,
    default: 0,
  },
});

const titulo = typeof route?.meta?.título === 'function'
  ? computed(() => route.meta.título())
  : route?.meta?.título;

const alertStore = useAlertStore();
const macrotemasStore = useMacrotemasPsStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(macrotemasStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = props.macrotemaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values, pdm_id: Number(route.params.planoSetorialId) };

    if (route.params?.macrotemaId) {
      response = await macrotemasStore.salvarItem(
        dataToSend,
        route.params.macrotemaId,
      );
    } else {
      response = await macrotemasStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      macrotemasStore.$reset();
      router.push({ name: `${route.meta.entidadeMãe}.planosSetoriaisMacrotemas` });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

macrotemasStore.$reset();
// não foi usada a prop.macrotemaId pois estava vazando do edit na hora de criar uma nova
if (route.params?.macrotemaId) {
  macrotemasStore.buscarItem(route.params?.macrotemaId);
}
</script>

<style></style>
