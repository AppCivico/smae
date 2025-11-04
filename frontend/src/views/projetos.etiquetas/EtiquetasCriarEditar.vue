<template>
  <CabecalhoDePagina
    class="mb2"
    :formulario-sujo="formularioSujo"
  />

  <form @submit.prevent="onSubmit">
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="portfolio_id"
          :schema="schema"
        />
        <Field
          name="portfolio_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.portfolio_id,
            loading: portfolioStore.chamadasPendentes?.lista,
          }"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="portfolio in portfoliosLista"
            :key="portfolio.id"
            :value="portfolio.id"
          >
            {{ portfolio.titulo }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg mb1"
          name="portfolio_id"
        />
      </div>
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

    <div class="flex justifycenter mb2">
      <button
        type="submit"
        class="btn big"
        :aria-disabled="isSubmitting || !!Object.keys(errors)?.length"
      >
        Salvar
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import { projetoEtiqueta as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { usePortfolioStore } from '@/stores/portfolios.store';
import { useProjetoEtiquetasStore } from '@/stores/projetoEtiqueta.store';

const route = useRoute();
const router = useRouter();
const props = defineProps<{
  etiquetaId?: number;
}>();

const alertStore = useAlertStore();
const portfolioStore = usePortfolioStore();
const projetoEtiquetasStore = useProjetoEtiquetasStore();
const { itemParaEdicao } = storeToRefs(projetoEtiquetasStore);
const { lista: portfoliosLista } = storeToRefs(portfolioStore);

const {
  errors,
  handleSubmit,
  isSubmitting,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

const onSubmit = handleSubmit(async (values) => {
  try {
    let response: boolean;
    const msg = props.etiquetaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values };

    if (props.etiquetaId) {
      response = await projetoEtiquetasStore.salvarItem(
        dataToSend,
        props.etiquetaId,
      );
    } else {
      response = await projetoEtiquetasStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      projetoEtiquetasStore.$reset();
      router.push({ name: route.meta.rotaDeEscape as string });
    }
  } catch (error: unknown) {
    alertStore.error(error);
  }
});

onMounted(() => {
  portfolioStore.buscarTudo({}, true);

  if (props.etiquetaId) {
    projetoEtiquetasStore.buscarItem(props.etiquetaId);
  }
});
</script>

<style></style>
