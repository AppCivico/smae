<script setup>
import { monitoramentoDePlanoDeAção as schema } from '@/consts/formSchemas';
import requestS from '@/helpers/requestS.ts';
import { useAlertStore } from '@/stores/alert.store';
import { usePlanosDeAçãoStore } from '@/stores/planosDeAcao.store.ts';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, Form,
} from 'vee-validate';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const alertStore = useAlertStore();
const planosDeAçãoStore = usePlanosDeAçãoStore();

const router = useRouter();

const chamadaPendente = ref(false);

const {
  chamadasPendentes,
  emFoco,
  erro,
  itemParaEdicao,
} = storeToRefs(planosDeAçãoStore);

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
  planoId: {
    type: Number,
    default: 0,
  },
});

async function onSubmit(_, { controlledValues: carga }) {
  chamadaPendente.value = true;

  try {
    const resposta = await requestS.post(`${baseUrl}/projeto/${props.projetoId}/plano-acao-monitoramento`, carga);

    if (resposta) {
      alertStore.success('Dados salvos com sucesso!');
      planosDeAçãoStore.$reset();
      router.push({ name: 'planosDeAçãoListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
  chamadaPendente.value = false;
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <div>
      <div class="t12 uc w700 tamarelo">
        {{ emFoco?.contramedida }}
      </div>

      <h1>
        {{ $route?.meta?.título || 'Monitoramento de plano de ação' }}
      </h1>
    </div>

    <CheckClose />
  </div>

  <Form
    v-if="!planoId || emFoco"
    v-slot="{ errors, isSubmitting, setFieldValue }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="itemParaEdicao"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <Field
      name="plano_acao_id"
      :value="planoId"
      type="hidden"
    />

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">
          Ações tomadas
        </label>
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

    <div class="flex g2">
      <div class="f1 mb1">
        <label class="label tc300">
          Data de aferição&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          name="data_afericao"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.data_afericao }"
          maxlength="10"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('data_afericao', $v || null); }"
        />
        <ErrorMessage
          name="data_afericao"
          class="error-msg"
        />
      </div>
    </div>

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
