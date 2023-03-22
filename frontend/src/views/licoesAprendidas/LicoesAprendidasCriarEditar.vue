<script setup>
// eslint-disable-next-line import/no-extraneous-dependencies
import CheckClose from '@/components/CheckClose.vue';
import { liçãoAprendida as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useLiçõesAprendidasStore } from '@/stores/licoesAprendidas.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  Form
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const alertStore = useAlertStore();
const licoesaprendidasStore = useLiçõesAprendidasStore();
const tarefasStore = useTarefasStore();
const router = useRouter();
const route = useRoute();

const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdição,
} = storeToRefs(licoesaprendidasStore);

const {
  tarefasComHierarquia,
} = storeToRefs(tarefasStore);

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
  licoesaprendidaId: {
    type: Number,
    default: 0,
  },
});

async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.licoesaprendidaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.licoesaprendidaId
      ? await licoesaprendidasStore.salvarItem(carga, props.licoesaprendidaId)
      : await licoesaprendidasStore.salvarItem(carga);

    if (resposta) {
      alertStore.success(msg);
      await router.push({ name: 'liçõesAprendidasListar' });
      licoesaprendidasStore.$reset();
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function excluirLicoesAprendida(id) {
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

console.debug('schema', schema);

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      <div
        v-if="licoesaprendidaId"
        class="t12 uc w700 tamarelo"
      >
        {{ 'Editar licoesaprendida' }}
      </div>
      {{ emFoco?.descricao
        || (licoesaprendidaId ? 'LicoesAprendida' : 'Nova lição aprendida') }}
    </h1>

    <hr class="ml2 f1">
    <MenuDeMudançaDeStatusDeLicoesAprendida
      v-if="emFoco?.id"
    />

    <CheckClose />
  </div>

  <Form
    v-if="!licoesaprendidaId || emFoco"
    v-slot="{ errors, isSubmitting }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="itemParaEdição"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <label class="label tc300">
          {{ schema.fields['data_registro'].spec.label }}&nbsp;<span
            v-if="schema.fields['data_registro'].spec.presence === 'required'"
            class="tvermelho"
          >*</span>
        </label>
        <Field
          id="data_registro"
          name="data_registro"
          type="date"
          required
          class="inputtext light mb1"
          :class="{ 'error': errors.data_registro }"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="data_registro"
        />
      </div>

      <div class="f3 mb1">
        <label class="label tc300">
          {{ schema.fields['descricao'].spec.label }}&nbsp;<span
            v-if="schema.fields['descricao'].spec.presence === 'required'"
            class="tvermelho"
          >*</span>
        </label>
        <Field
          id="descricao"
          name="descricao"
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

    <div class="flex g2 mb1">
      <div class="f2 mb1">
        <label class="label tc300">
          {{ schema.fields['responsavel'].spec.label }}&nbsp;<span
            v-if="schema.fields['responsavel'].spec.presence === 'required'"
            class="tvermelho"
          >*</span>
        </label>
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

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">
          {{ schema.fields['observacao'].spec.label }}&nbsp;<span
            v-if="schema.fields['observacao'].spec.presence === 'required'"
            class="tvermelho"
          >*</span>
        </label>
        <Field
          id="observacao"
          name="observacao"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="500"
          :class="{ 'error': errors.observacao }"
        />
        <ErrorMessage
          name="observacao"
          class="error-msg"
        />
      </div>
    </div>

    <template v-if="Object.keys(errors).length">
      <p>Please correct the following errors</p>
      <ul>
        <li
          v-for="(message, field) in errors"
          :key="field"
        >
          <a :href="'#' + field">
            {{ message }}
          </a>
        </li>
      </ul>
    </template>

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

  <button
    v-if="emFoco?.id"
    class="btn amarelo big"
    @click="excluirLicoesAprendida(emFoco.id)"
  >
    Remover item
  </button>

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
