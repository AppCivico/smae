<script setup>
// import AutocompleteField from '@/components/AutocompleteField2.vue';
import { painelExterno as schema } from '@/consts/formSchemas';
// import months from '@/consts/months';
// import níveisRegionalização from '@/consts/niveisRegionalizacao';
import { useAlertStore } from '@/stores/alert.store';
import { useObservadoresStore } from '@/stores/observadores.store.ts';
import { useOrgansStore } from '@/stores/organs.store';
import { usePaineisExternosStore } from '@/stores/paineisExternos.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  painelId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const observadoresStore = useObservadoresStore();
const ÓrgãosStore = useOrgansStore();
const paineisStore = usePaineisExternosStore();
// const mesesDisponíveis = months.map((x, i) => ({ nome: x, id: i + 1 }));
const { chamadasPendentes, erro, itemParaEdição } = storeToRefs(paineisStore);
// const { órgãosComoLista } = storeToRefs(ÓrgãosStore);
// const {
//   lista: gruposDeObservadores,
//   chamadasPendentes: gruposDeObservadoresPendentes,
//   erro: erroNosDadosDeObservadores,
// } = storeToRefs(observadoresStore);

paineisStore.$reset();

async function onSubmit(values) {
  try {
    let r;
    const msg = props.painelId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.painelId) {
      r = await paineisStore.salvarItem(values, props.painelId);
    } else {
      r = await paineisStore.salvarItem(values);
    }
    if (r) {
      alertStore.success(msg);
      paineisStore.$reset();
      router.push({ name: 'portfoliosListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

if (props.painelId) {
  paineisStore.buscarItem(props.painelId);
}

ÓrgãosStore.getAll().finally(() => {
  chamadasPendentes.value.emFoco = false;
});

observadoresStore.buscarTudo(); //
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Painel Externo' }}</h1>
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
          name="titulo"
          :schema="schema"
        />
        <Field
          name="titulo"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="titulo"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="descricao"
          :schema="schema"
        />
        <Field
          name="descricao"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="500"
          :class="{ 'error': errors.descricao }"
        />
        <ErrorMessage
          name="descricao"
          class="error-msg"
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
