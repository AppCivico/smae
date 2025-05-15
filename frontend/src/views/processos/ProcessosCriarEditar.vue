<script setup>
import SmaeText from '@/components/camposDeFormulario/SmaeText/SmaeText.vue';
import { processo as schema } from '@/consts/formSchemas';
import formatProcesso from '@/helpers/formatProcesso';
import { useAlertStore } from '@/stores/alert.store';
import { useProcessosStore } from '@/stores/processos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
  useIsFormDirty,
} from 'vee-validate';
import { watch } from 'vue';

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
  itemParaEdicao,
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

const {
  errors, handleSubmit, isSubmitting, resetForm, values: carga,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async () => {
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
});

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

const formularioSujo = useIsFormDirty();

iniciar();

watch(itemParaEdicao, (novosValores) => {
  resetForm({ values: novosValores });
});

resetForm();
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

    <CheckClose :formulario-sujo="formularioSujo" />
  </div>

  <form
    v-if="!processoId || emFoco"
    :disabled="chamadasPendentes.emFoco"
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
        <SmaeText
          name="descricao"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="2048"
          v-model="carga.descricao"
          anular-vazio
        />
        <ErrorMessage
          name="descricao"
          class="error-msg"
        />
      </div>
    </div>
    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="comentarios"
          :schema="schema"
        />
        <SmaeText
          name="comentarios"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="2048"
          :model-value="carga.comentarios"
          anular-vazio
        />
        <ErrorMessage
          name="comentarios"
          class="error-msg"
        />
      </div>
    </div>
    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="observacoes"
          :schema="schema"
        />
        <SmaeText
          name="observacoes"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="2048"
          :model-value="carga.observacoes"
          anular-vazio
        />
        <ErrorMessage
          name="observacoes"
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
  </form>

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
