<script setup>
// eslint-disable-next-line import/no-extraneous-dependencies
import CheckClose from '@/components/CheckClose.vue';
import { processo as schema } from '@/consts/formSchemas';
import formatProcesso from '@/helpers/formatProcesso';
import { useAlertStore } from '@/stores/alert.store';
import { useProcessosStore } from '@/stores/processos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  Form
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const alertStore = useAlertStore();
const processosStore = useProcessosStore();
const tarefasStore = useTarefasStore();
const router = useRouter();
const route = useRoute();

const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdição,
} = storeToRefs(processosStore);

const {
  tarefasComHierarquia,
} = storeToRefs(tarefasStore);

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
  processoId: {
    type: Number,
    default: 0,
  },
});

async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.processoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.processoId
      ? await processosStore.salvarItem(carga, props.processoId)
      : await processosStore.salvarItem(carga);

    if (resposta) {
      alertStore.success(msg);
      processosStore.$reset();
      router.push({ name: 'processosListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function excluirProcesso(id) {
  useAlertStore().confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await useProcessosStore().excluirItem(id)) {
      useProcessosStore().$reset();
      useProcessosStore().buscarTudo();
      useAlertStore().success('Processo removido.');

      const rotaDeEscape = route.meta?.rotaDeEscape;

      if (rotaDeEscape) {
        router.push(typeof rotaDeEscape === 'string' ? { name: rotaDeEscape } : rotaDeEscape);
      }
    }
  }, 'Remover');
}

function maskProcesso(el) {
  el.target.value = formatProcesso(el.target.value);
}

function iniciar() {
  if (!tarefasComHierarquia.value.length) {
    tarefasStore.buscarTudo();
  }
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      <div
        v-if="processoId"
        class="t12 uc w700 tamarelo"
      >
        {{ 'Editar processo' }}
      </div>
      {{ emFoco?.descricao || (processoId ? 'Processo' : 'Novo processo') }}
    </h1>

    <hr class="ml2 f1">
    <MenuDeMudançaDeStatusDeProcesso
      v-if="emFoco?.id"
    />

    <CheckClose />
  </div>

  <Form
    v-if="!processoId || emFoco"
    v-slot="{ errors, isSubmitting }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="itemParaEdição"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="processo_sei"
          :schema="schema"
        />
        <Field
          name="processo_sei"
          type="text"
          required
          class="inputtext light mb1"
          :class="{ 'error': errors.processo_sei }"
          placeholder="DDDD.DDDD/DDDDDDD-D"
          @keyup="maskProcesso"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="processo_sei"
        />
      </div>
      <div class="f2 mb1">
        <LabelFromYup
          name="link"
          :schema="schema"
        />
        <Field
          name="link"
          required
          type="url"
          class="inputtext light mb1"
          :class="{
            error: errors.link,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
          placeholder="https://"
        />
        <ErrorMessage
          name="link"
          class="error-msg"
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

  <div
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >
    Carregando
  </div>

  <button
    v-if="emFoco?.id"
    class="btn amarelo big"
    @click="excluirProcesso(emFoco.id)"
  >
    Remover item
  </button>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
