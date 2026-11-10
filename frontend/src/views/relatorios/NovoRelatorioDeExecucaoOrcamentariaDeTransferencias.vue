<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm,
} from 'vee-validate';
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import SmaeNumberInput from '@/components/camposDeFormulario/SmaeNumberInput.vue';
import CampoDeModeloDeRelatorio from '@/components/relatorios/CampoDeModeloDeRelatorio.vue';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import schema from '@/consts/formSchemas/relatorioDeExecucaoOrcamentariaDeTransferencias';
import nulificadorTotal from '@/helpers/nulificadorTotal';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';

const alertStore = useAlertStore();
const authStore = useAuthStore();
const relatoriosStore = useRelatoriosStore();
const tipoDeTransferenciaStore = useTipoDeTransferenciaStore();

const { tiposDeVisibilidade } = storeToRefs(relatoriosStore);
const { lista: tiposDeTransferencia } = storeToRefs(tipoDeTransferenciaStore);

const route = useRoute();
const router = useRouter();

const {
  errors, handleSubmit, isSubmitting, setFieldValue, values,
} = useForm({
  initialValues: {
    fonte: route.meta.fonteDoRelatorio,
    modelo_id: '',
    parametros: {
      ano_fim: null,
      ano_inicio: null,
      esfera: null,
      tipo_id: null,
    },
    visibilidade_tipo: null,
  },
  validationSchema: schema,
});

const tiposDisponiveis = computed(() => (values.parametros.esfera
  ? tiposDeTransferencia.value.filter((tipo) => tipo.esfera === values.parametros.esfera)
  : tiposDeTransferencia.value));

// Sem esfera, todos os tipos ficam disponíveis; ao escolher uma esfera, descarta-se o tipo
// selecionado se ele não pertencer a ela.
watch(() => values.parametros.esfera, (esfera) => {
  const tipoAtual = tiposDeTransferencia.value
    .find((tipo) => tipo.id === values.parametros.tipo_id);

  if (esfera && tipoAtual && tipoAtual.esfera !== esfera) {
    setFieldValue('parametros.tipo_id', null);
  }
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  // `modelo_id` chega como string vazia quando "Layout padrão" é selecionado (select nativo
  // não reflete `null`) — nulificadorTotal converte para `null` antes de enviar.
  const carga = nulificadorTotal(valoresControlados);

  async function enviar() {
    try {
      if (await relatoriosStore.insert(carga)) {
        alertStore.success('Relatório em processamento, acompanhe na tela de listagem');
        router.push({ name: route.meta.rotaDeEscape });
      }
    } catch (error) {
      alertStore.error(error);
    }
  }

  const tipoDeVisibilidade = tiposDeVisibilidade.value
    .find((item) => item.tipo === carga.visibilidade_tipo);

  if (tipoDeVisibilidade?.requer_confirmacao) {
    alertStore.confirmAction(tipoDeVisibilidade.mensagem_confirmacao, enviar);
  } else {
    await enviar();
  }
});

tipoDeTransferenciaStore.buscarTudo();
relatoriosStore.buscarTiposDeVisibilidade();
</script>

<template>
  <CabecalhoDePagina :formulario-sujo="false" />

  <form
    :disabled="isSubmitting"
    @submit.prevent="!isSubmitting && onSubmit()"
  >
    <Field
      name="fonte"
      type="hidden"
    />

    <div class="flex flexwrap g2 mb2">
      <div class="f1">
        <LabelFromYup
          name="esfera"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.esfera"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors['parametros.esfera'] }"
          @change="!$event.target.value ? setFieldValue('parametros.esfera', null) : null"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in Object.values(esferasDeTransferencia)"
            :key="item.valor"
            :value="item.valor"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg"
          name="parametros.esfera"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="tipo_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.tipo_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.tipo_id'],
            loading: tipoDeTransferenciaStore.chamadasPendentes?.lista,
          }"
          :disabled="!tiposDisponiveis.length"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in tiposDisponiveis"
            :key="item.id"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg"
          name="parametros.tipo_id"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="ano_inicio"
          :schema="schema.fields.parametros"
        />
        <SmaeNumberInput
          name="parametros.ano_inicio"
          :model-value="values.parametros.ano_inicio"
          min="2003"
          step="1"
          class="inputtext light mb1"
          :class="{ error: errors['parametros.ano_inicio'] }"
        />
        <ErrorMessage
          class="error-msg"
          name="parametros.ano_inicio"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="ano_fim"
          :schema="schema.fields.parametros"
        />
        <SmaeNumberInput
          name="parametros.ano_fim"
          :model-value="values.parametros.ano_fim"
          :min="values.parametros.ano_inicio || 2003"
          step="1"
          class="inputtext light mb1"
          :class="{ error: errors['parametros.ano_fim'] }"
        />
        <ErrorMessage
          class="error-msg"
          name="parametros.ano_fim"
        />
      </div>
    </div>

    <div class="flex flexwrap g2 mb2">
      <div class="f1">
        <LabelFromYup
          name="visibilidade_tipo"
          :schema="schema"
          required
        />
        <Field
          name="visibilidade_tipo"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors['visibilidade_tipo'] }"
          :aria-busy="relatoriosStore.chamadasPendentes.tiposDeVisibilidade"
        >
          <option
            value=""
            disabled
          >
            Selecionar
          </option>
          <option
            v-for="item in tiposDeVisibilidade"
            :key="item.tipo"
            :value="item.tipo"
            :disabled="item.tipo === 'meu_orgao' && !authStore.user?.orgao_id"
          >
            {{ item.label }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg"
          name="visibilidade_tipo"
        />
      </div>
    </div>

    <CampoDeModeloDeRelatorio :schema="schema" />

    <SmaeFieldsetSubmit
      :erros="errors"
      :esta-carregando="isSubmitting"
      :aria-disabled="isSubmitting"
      rotulo="Criar relatório"
      class="mb2"
    />
  </form>
</template>
