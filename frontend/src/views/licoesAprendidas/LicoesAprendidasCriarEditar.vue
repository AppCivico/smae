<script setup>
// eslint-disable-next-line import/no-extraneous-dependencies
import SmaeText from '@/components/camposDeFormulario/SmaeText.vue';
import { liçãoAprendida as schema } from '@/consts/formSchemas';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useLiçõesAprendidasStore } from '@/stores/licoesAprendidas.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  Form,
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const alertStore = useAlertStore();
const liçõesAprendidasStore = useLiçõesAprendidasStore();
const tarefasStore = useTarefasStore();
const router = useRouter();
const route = useRoute();

const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdicao,
} = storeToRefs(liçõesAprendidasStore);

const {
  tarefasComHierarquia,
} = storeToRefs(tarefasStore);

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
  licaoAprendidaId: {
    type: Number,
    default: 0,
  },
});

async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.licaoAprendidaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.licaoAprendidaId
      ? await liçõesAprendidasStore.salvarItem(carga, props.licaoAprendidaId)
      : await liçõesAprendidasStore.salvarItem(carga);

    if (resposta) {
      alertStore.success(msg);
      liçõesAprendidasStore.$reset();
      router.push({ name: 'liçõesAprendidasListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function excluirLiçãoAprendida(id) {
  useAlertStore().confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await useLiçõesAprendidasStore().excluirItem(id)) {
      useLiçõesAprendidasStore().$reset();
      useLiçõesAprendidasStore().buscarTudo();
      useAlertStore().success('LicoesAprendida removido.');

      const rotaDeEscape = route.meta?.rotaDeEscape;

      if (rotaDeEscape) {
        router.push(typeof rotaDeEscape === 'string' ? { name: rotaDeEscape } : rotaDeEscape);
      }
    }
  }, 'Remover');
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
      <template v-if="emFoco?.sequencial">
        {{ emFoco.sequencial }} -
      </template>

      {{ emFoco?.contexto
        ? truncate(emFoco.contexto, 36)
        : 'Lição Aprendida' || 'Nova lição aprendida' }}
    </h1>

    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <Form
    v-if="!licaoAprendidaId || emFoco"
    v-slot="{ errors, isSubmitting, setFieldValue, values }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="itemParaEdicao"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f05 mb1">
        <LabelFromYup
          name="data_registro"
          :schema="schema"
        />
        <Field
          id="data_registro"
          name="data_registro"
          type="date"
          required
          class="inputtext light mb1"
          :class="{ 'error': errors.data_registro }"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('data_registro', $v || null); }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="data_registro"
        />
      </div>
      <div class="f2 mb1">
        <LabelFromYup
          name="responsavel"
          :schema="schema"
        />
        <Field
          id="responsavel"
          name="responsavel"
          required
          type="text"
          class="inputtext light mb1"
          :class="{
            error: errors.responsavel,
            loading: chamadasPendentes.validaçãoDeDependências
          }"
        />
        <ErrorMessage
          name="responsavel"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f2 mb1">
        <LabelFromYup
          name="contexto"
          :schema="schema"
        />
        <SmaeText
          name="contexto"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          max-length="2048"
          :schema="schema"
          :model-value="values.contexto"
          anular-vazio
          :class="{ 'error': errors.contexto }"
        />
        <ErrorMessage
          name="contexto"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f2 mb1">
        <LabelFromYup
          name="descricao"
          :schema="schema"
        />
        <SmaeText
          name="descricao"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          max-length="2048"
          :schema="schema"
          :model-value="values.descricao"
          anular-vazio
          :class="{ 'error': errors.descricao }"
        />
        <ErrorMessage
          name="descricao"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f2 mb1">
        <LabelFromYup
          name="resultado"
          :schema="schema"
        />
        <SmaeText
          name="resultado"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          max-length="2048"
          :schema="schema"
          :model-value="values.resultado"
          anular-vazio
          :class="{ 'error': errors.resultado }"
        />
        <ErrorMessage
          name="resultado"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="observacao"
          :schema="schema"
        />
        <SmaeText
          name="observacao"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          max-length="2048"
          :schema="schema"
          :model-value="values.observacao"
          anular-vazio
          :class="{ 'error': errors.observacao }"
        />
        <ErrorMessage
          name="observacao"
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
    @click="excluirLiçãoAprendida(emFoco.id)"
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
