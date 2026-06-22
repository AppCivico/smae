<script setup>
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { relatóriosOrçamentáriosPortfolioObras as schema } from '@/consts/formSchemas';
import maskMonth from '@/helpers/maskMonth';
import monthAndYearToDate from '@/helpers/monthAndYearToDate';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store.ts';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';

const portfolioObrasStore = usePortfolioObraStore();
const alertStore = useAlertStore();
const authStore = useAuthStore();
const relatoriosStore = useRelatoriosStore();
const { tiposDeVisibilidade } = storeToRefs(relatoriosStore);
const route = useRoute();
const router = useRouter();

const initialValues = computed(() => ({
  fonte: 'ObrasOrcamento',
  parametros: {
    tipo: 'Analitico',
    inicio: '',
    fim: '',
    portfolio_id: 0,
    projeto_id: 0,
  },
  visibilidade_tipo: null,
}));

async function onSubmit(values) {
  const carga = values;
  carga.parametros.inicio = monthAndYearToDate(carga.parametros.inicio);
  carga.parametros.fim = monthAndYearToDate(carga.parametros.fim);

  async function enviar() {
    try {
      const r = await relatoriosStore.insert(carga);
      const msg = 'Relatório em processamento, acompanhe na tela de listagem';
      if (r === true) {
        alertStore.success(msg);
        router.push({ name: route.meta.rotaDeEscape });
      }
    } catch (error) {
      alertStore.error(error);
    }
  }

  const tipoSelecionado = tiposDeVisibilidade.value
    .find((item) => item.tipo === values.visibilidade_tipo);

  if (tipoSelecionado?.requer_confirmacao) {
    alertStore.confirmAction(tipoSelecionado.mensagem_confirmacao, enviar);
  } else {
    await enviar();
  }
}

function iniciar() {
  portfolioObrasStore.buscarTudo();
  relatoriosStore.buscarTiposDeVisibilidade();
}

iniciar();
</script>

<template>
  <CabecalhoDePagina :formulario-sujo="false" />

  <Form
    v-slot="{ errors, isSubmitting, setFieldValue }"
    :validation-schema="schema"
    :initial-values="initialValues"
    @submit="onSubmit"
  >
    <div class="flex g2 mb2">
      <div class="f1">
        <LabelFromYup
          name="portfolio_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.portfolio_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.portfolio_id'],
            loading: portfolioObrasStore.chamadasPendentes.lista
          }"
          :disabled="portfolioObrasStore.chamadasPendentes.lista"
          @change="setFieldValue('parametros.projeto_id', 0)"
        >
          <option :value="0">
            Selecionar
          </option>
          <option
            v-for="item in portfolioObrasStore.lista"
            :key="item.id"
            :value="item.id"
          >
            {{ item.id }} - {{ item.titulo }}
          </option>
        </Field>
        <div
          v-if="errors['parametros.portfolio_id']"
          class="error-msg"
        >
          {{ errors['parametros.portfolio_id'] }}
        </div>
      </div>
      <div class="f1">
        <label
          for="inicio"
          class="label"
        >mês/ano início <span class="tvermelho">*</span></label>
        <Field
          id="inicio"
          placeholder="01/2003"
          name="parametros.inicio"
          type="text"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametro.inicio'] }"
          maxlength="7"
          @keyup="maskMonth"
        />
        <div class="error-msg">
          {{ errors['parametros.inicio'] }}
        </div>
      </div>
      <div class="f1">
        <label
          for="fim"
          class="label"
        >mês/ano final <span class="tvermelho">*</span></label>
        <Field
          id="fim"
          placeholder="01/2003"
          name="parametros.fim"
          type="text"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametros.fim'] }"
          maxlength="7"
          @keyup="maskMonth"
        />
        <div class="error-msg">
          {{ errors['parametros.fim'] }}
        </div>
      </div>
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
        <div
          v-if="errors['visibilidade_tipo']"
          class="error-msg"
        >
          {{ errors['visibilidade_tipo'] }}
        </div>
      </div>
    </div>

    <div class="mb2">
      <label class="block mb1">
        <Field
          name="parametros.tipo"
          type="radio"
          value="Consolidado"
          class="inputcheckbox"
          :class="{ 'error': errors['parametros.tipo'] }"
        />
        <span>Consolidado</span>
      </label>
      <label class="block mb1">
        <Field
          name="parametros.tipo"
          type="radio"
          value="Analitico"
          class="inputcheckbox"
          :class="{ 'error': errors['parametros.tipo'] }"
        />
        <span>Analítico</span>
      </label>
      <div class="error-msg">
        {{ errors['parametros.tipo'] }}
      </div>
    </div>

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        type="submit"
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
      >
        Criar relatório
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
</template>
