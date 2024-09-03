<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { bancada as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useBancadasStore } from '@/stores/bancadas.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  bancadaId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const bancadasStore = useBancadasStore();
const partidoStore = usePartidosStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(bancadasStore);

const {
  lista: listaDePartidos,
  chamadasPendentes: { lista: listaDePartidosPendente },
  erro: erroNaListagemDePartidos,
} = storeToRefs(partidoStore);

async function onSubmit(_, { controlledValues }) {
  try {
    let r;
    const msg = props.bancadaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.bancadaId) {
      r = await bancadasStore.salvarItem(controlledValues, props.bancadaId);
    } else {
      r = await bancadasStore.salvarItem(controlledValues);
    }
    if (r) {
      alertStore.success(msg);
      bancadasStore.$reset();
      router.push({ name: 'bancadasListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

if (props.bancadaId) {
  bancadasStore.buscarItem(props.bancadaId);
}

partidoStore.buscarTudo();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Bancada' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <LoadingComponent
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >
    Carregando
  </LoadingComponent>

  <Form
    v-slot="{ errors, isSubmitting, values }"
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

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="sigla"
          :schema="schema"
        />
        <Field
          name="sigla"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="sigla"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="partido_ids"
          :schema="schema"
          class="tc300"
        />

        <AutocompleteField
          :disabled="listaDePartidosPendente"
          name="partido_ids"
          :controlador="{ busca: '', participantes: values.partido_ids || [] }"
          :class="{ error: erroNaListagemDePartidos, loading: listaDePartidosPendente }"
          :grupo="listaDePartidos"
          label="nome"
        />
        <ErrorMessage
          name="partido_ids"
          class="error-msg"
        />
      </div>

      <ErrorComponent v-if="erroNaListagemDePartidos">
        {{ erroNaListagemDePartidos }}
      </ErrorComponent>
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

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
