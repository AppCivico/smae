<script setup>
import { tipoDeAcompanhamento as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useTiposDeAcompanhamentoStore } from '@/stores/tiposDeAcompanhamento.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  Form,
} from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const alertStore = useAlertStore();
const tiposDeAcompanhamentoStore = useTiposDeAcompanhamentoStore();
const router = useRouter();
const route = useRoute();

const {
  chamadasPendentes,
  erro,
  tiposPorId,
} = storeToRefs(tiposDeAcompanhamentoStore);

const props = defineProps({
  tipoDeAtendimentoId: {
    type: Number,
    default: 0,
  },
});

const emFoco = computed(() => tiposPorId.value[route.params.tipoDeAtendimentoId] || null);

async function onSubmit(_, { controlledValues }) {
  const carga = controlledValues;

  try {
    const msg = props.tipoDeAtendimentoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.tipoDeAtendimentoId
      ? await tiposDeAcompanhamentoStore.salvarItem(carga, props.tipoDeAtendimentoId)
      : await tiposDeAcompanhamentoStore.salvarItem(carga);

    if (resposta) {
      alertStore.success(msg);
      tiposDeAcompanhamentoStore.$reset();
      tiposDeAcompanhamentoStore.buscarTudo();
      router.push({ name: 'tipoDeAcompanhamentoListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function excluirTipoDeAcompanhamento(id) {
  alertStore.confirmAction('Todos os acompanhamentos associados perderão seu tipo. Deseja mesmo remover esse item?', async () => {
    if (await tiposDeAcompanhamentoStore.excluirItem(id)) {
      tiposDeAcompanhamentoStore.$reset();
      tiposDeAcompanhamentoStore.buscarTudo();
      alertStore.success('Acompanhamento removido.');

      const rotaDeEscape = route.meta?.rotaDeEscape;

      if (rotaDeEscape) {
        router.push(typeof rotaDeEscape === 'string' ? { name: rotaDeEscape } : rotaDeEscape);
      }
    }
  }, 'Remover');
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      <div
        v-if="tipoDeAtendimentoId"
        class="t12 uc w700 tamarelo"
      >
        {{ 'Editar acompanhamento' }}
      </div>
      {{ emFoco?.nome
        ? emFoco?.nome
        : (tipoDeAtendimentoId ? 'Acompanhamento' : 'Novo registro de acompanhamento')
      }}
    </h1>

    <hr class="ml2 f1">

    <CheckClose />
  </div>

  <Form
    v-if="!tipoDeAtendimentoId || emFoco"
    v-slot="{ errors, isSubmitting }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="emFoco"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f2 mb1">
        <LabelFromYup
          name="nome"
          :schema="schema"
        />
        <Field
          id="nome"
          name="nome"
          required
          type="text"
          maxlength="2048"
          class="inputtext light mb1"
          :class="{
            error: errors.nome,
          }"
        />
        <ErrorMessage
          name="nome"
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
    v-else-if="emFoco?.id"
    class="btn amarelo big"
    @click="excluirTipoDeAcompanhamento(emFoco.id)"
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
