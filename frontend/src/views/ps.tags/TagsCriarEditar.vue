<template>
  <div class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <CheckClose />
  </div>
  <Form
    v-slot="{ errors, isSubmitting, values }"
    :validation-schema="schema"
    :initial-values="itemParaEdicao"
    @submit="onSubmit"
  >
    <div>
      <LabelFromYup
        name="ods_id"
        :schema="schema"
      />
      <Field
        name="ods_id"
        as="select"
        class="inputtext light mb1"
      >
        <option value="">
          Selecione
        </option>
        <option
          v-for="od in odsLista"
          :key="od.id"
          :value="od.id"
        >
          {{ od.titulo }}
        </option>
      </Field>
      <ErrorMessage
        class="error-msg mb1"
        name="ods_id"
      />
    </div>

    <div>
      <LabelFromYup
        name="descricao"
        :schema="schema"
      />

      <Field
        name="descricao"
        class="inputtext light mb1"
        type="text"
      />
    </div>

    <div>
      <LabelFromYup
        name="upload_icone"
        :schema="schema"
        for="icone"
      />
      <CampoDeArquivo
        id="icone"
        v-model="values.icone"
        accept=".svg,.png"
        name="upload_icone"
        tipo="LOGO_PDM"
      >
        Adicionar arquivo (formatos SVG ou PNG até 2mb)
      </CampoDeArquivo>
      <ErrorMessage name="upload_icone" />
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
import {
  ErrorMessage,
  Field, Form,
} from 'vee-validate';
import { defineOptions } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CampoDeArquivo from '@/components/CampoDeArquivo.vue';
import { tag as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useOdsStore } from '@/stores/odsPs.store';
import { useTagsPsStore } from '@/stores/tagsPs.store';

defineOptions({
  inheritAttrs: false,
});

const route = useRoute();
const router = useRouter();

const alertStore = useAlertStore();
const tagsStore = useTagsPsStore();
const odsStore = useOdsStore();

const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(tagsStore);
const {
  lista: odsLista, chamadasPendentes: odsChamadasPendentes, erro: odsErro,
} = storeToRefs(odsStore);

async function onSubmit(values) {
  try {
    let response;
    const msg = route.meta?.tagId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values, pdm_id: Number(route.params.planoSetorialId) };

    if (route.params?.tagId) {
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
      router.push({ name: `${route.meta.entidadeMãe}.planosSetoriaisTags` });
    }
  } catch (error) {
    alertStore.error(error);
  }
}
if (route.params.tagId) {
  tagsStore.buscarItem(route.params.tagId);
}

odsStore.buscarTudo();
</script>

<style></style>
