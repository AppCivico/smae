<script setup lang="ts">
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  useForm,
} from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { boolean, number, object } from 'yup';

import MaskedFloatInput from '@/components/MaskedFloatInput.vue';
import SmaeDialog from '@/components/SmaeDialog.vue';
import SmaeFieldsetSubmit from '@/components/SmaeFieldsetSubmit.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store.ts';

const alertStore = useAlertStore();
const route = useRoute();

const variaveisGlobaisStore = useVariaveisGlobaisStore();
const {
  chamadasPendentes,
  emFoco,
} = storeToRefs(variaveisGlobaisStore);

const emit = defineEmits(['edicao-bem-sucedida']);

// ID do diálogo - deve ser único
const DIALOG_ID = 'editar-valor-base';

// Buscar IDs da query string
const variavelFilhaId = computed(() => {
  const id = route.query.variavel_filha_id || route.query.variavelFilhaId;
  return id ? Number(id) : null;
});

const variavelMaeId = computed(() => {
  const id = route.query.variavel_mae_id || route.query.variavelMaeId;
  return id ? Number(id) : null;
});

// Computed para verificar se o diálogo está aberto
const dialogoEstaAberto = computed(
  () => route.query.dialogo === DIALOG_ID,
);

const schema = object({
  valor_base: number()
    .label('Valor base')
    .min(0)
    .required('Valor base é obrigatório'),
  suspendida: boolean()
    .label('Suspender variável')
    .nullable(),
});

const {
  errors,
  handleSubmit,
  resetForm,
  values,
} = useForm({
  validationSchema: schema,
  initialValues: {
    valor_base: emFoco.value?.valor_base || null,
    suspendida: emFoco.value?.suspendida || false,
  },
});

// Ref para armazenar a função de fechar recebida do SmaeDialog
const fecharDialogo = ref<(() => void) | null>(null);

const onSubmit = handleSubmit(async (valoresControlados) => {
  // Validar se há IDs necessários
  if (!variavelFilhaId.value) {
    alertStore.error('ID da variável não encontrado na URL');
    return;
  }

  if (!variavelMaeId.value) {
    alertStore.error('ID da variável mãe não encontrado na URL');
    return;
  }

  // Validar se é uma variável numérica antes de salvar
  if (emFoco.value?.variavel_categorica_id) {
    alertStore.error('Apenas variáveis numéricas podem ter valor base editado');
    return;
  }

  try {
    const resposta = await variaveisGlobaisStore.salvarFilha(
      variavelMaeId.value,
      variavelFilhaId.value,
      valoresControlados,
    );
    if (resposta) {
      alertStore.success('Valor base atualizado com sucesso!');
      // Usa a função de fechar fornecida pelo SmaeDialog
      if (fecharDialogo.value) {
        fecharDialogo.value();
        // Limpa emFoco após fechar o diálogo
        variaveisGlobaisStore.emFoco = null;
      }
      emit('edicao-bem-sucedida');
    }
  } catch (error) {
    alertStore.error(error);
  }
});

// Buscar a variável e atualizar o formulário quando o diálogo abrir ou a variável mudar
watch([dialogoEstaAberto, variavelFilhaId], async ([dialogoAberto, filhaId]) => {
  if (dialogoAberto && filhaId) {
    // Busca a variável se não estiver carregada ou se o ID mudou
    if (!emFoco.value || emFoco.value.id !== Number(filhaId)) {
      await variaveisGlobaisStore.buscarItem(filhaId);
    }

    // Atualiza o formulário com os valores da variável
    resetForm({
      values: {
        valor_base: emFoco.value?.valor_base || null,
        suspendida: emFoco.value?.suspendida || false,
      },
    });
  }
}, { immediate: true });
</script>

<template>
  <SmaeDialog
    :id="DIALOG_ID"
    titulo="Edição de variável filha"
    :parametros-associados="[
      'variavel_filha_id',
      'variavelFilhaId',
      'variavel_mae_id',
      'variavelMaeId',
    ]"

    :subtitulo="emFoco ? emFoco?.codigo + '-' + emFoco?.titulo : ''"
  >
    <template #default="{ fecharDialogo: fecharFn }">
      <form
        :aria-busy="chamadasPendentes.emFoco"
        @submit.prevent="fecharDialogo = fecharFn; onSubmit()"
      >
        <div
          v-if="emFoco?.variavel_categorica_id"
          class="error-msg mb2"
        >
          Variáveis categóricas não possuem valor base.
        </div>

        <div
          v-else
          class="mb2"
        >
          <SmaeLabel
            name="valor_base"
            :schema="schema"
          />
          <MaskedFloatInput
            :value="values.valor_base"
            name="valor_base"
            class="inputtext light mb1"
            converter-para="string"
            :class="{ error: errors.valor_base }"
          />
          <ErrorMessage
            class="error-msg"
            name="valor_base"
          />
        </div>

        <div class="mb2">
          <label class="flex center g1">
            <Field
              name="suspendida"
              type="checkbox"
              :value="true"
              :unchecked-value="false"
            />
            <SmaeLabel
              class="mb0"
              name="suspendida"
              as="span"
              :schema="schema"
              :class="{ error: errors.suspendida }"
            />
          </label>
          <ErrorMessage
            class="error-msg"
            name="suspendida"
          />
        </div>

        <SmaeFieldsetSubmit
          :erros="errors"
          :esta-carregando="chamadasPendentes.emFoco"
          class="mt2"
        >
          <button
            type="submit"
            class="btn big"
            :disabled="!!(chamadasPendentes.emFoco || emFoco?.variavel_categorica_id)"
          >
            Salvar
          </button>
        </SmaeFieldsetSubmit>
      </form>
    </template>
  </SmaeDialog>
</template>
