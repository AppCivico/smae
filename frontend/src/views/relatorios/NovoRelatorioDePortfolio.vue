<script setup>
import { storeToRefs } from 'pinia';
import {
  Field, Form,
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

import { relatórioDePortfolio as schema } from '@/consts/formSchemas';
import listaDeStatuses from '@/consts/projectStatuses';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';

const route = useRoute();
const router = useRouter();

const alertStore = useAlertStore();
const authStore = useAuthStore();
const relatoriosStore = useRelatoriosStore();
const ÓrgãosStore = useOrgansStore();
const portfolioStore = usePortfolioStore();

const { organs, órgãosComoLista } = storeToRefs(ÓrgãosStore);
const { tiposDeVisibilidade } = storeToRefs(relatoriosStore);

const initialValues = {
  fonte: 'Projetos',
  parametros: {
    status: null,
    orgao_responsavel_id: null,
    portfolio_id: null,
  },
  visibilidade_tipo: null,
};

async function onSubmit(values) {
  async function enviar() {
    try {
      const msg = 'Relatório em processamento, acompanhe na tela de listagem';
      const r = await relatoriosStore.insert(values);
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
  portfolioStore.buscarTudo();
  ÓrgãosStore.getAll();
  relatoriosStore.buscarTiposDeVisibilidade();
}

iniciar();
</script>

<template>
  <CabecalhoDePagina :formulario-sujo="false" />

  <Form
    v-slot="{ errors, isSubmitting }"
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
            loading: portfolioStore.chamadasPendentes.lista
          }"
          :disabled="portfolioStore.chamadasPendentes.lista"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in portfolioStore.lista"
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
      <div class="f1 mb1">
        <LabelFromYup
          name="orgao_responsavel_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.orgao_responsavel_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.orgao_responsavel_id'],
            loading: organs?.loading
          }"
          :disabled="!órgãosComoLista?.length"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in órgãosComoLista"
            :key="item"
            :value="item.id"
            :title="item.descricao?.length > 36 ? item.descricao : null"
          >
            {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
          </option>
        </Field>

        <div
          v-if="errors['parametros.orgao_responsavel_id']"
          class="error-msg"
        >
          {{ errors['parametros.orgao_responsavel_id'] }}
        </div>
      </div>

      <div class="f05 mb1">
        <LabelFromYup
          name="status"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.status"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors.status }"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in listaDeStatuses"
            :key="item.valor"
            :value="item.valor"
          >
            {{ item.nome }}
          </option>
        </Field>
        <div
          v-if="errors['parametros.status']"
          class="error-msg"
        >
          {{ errors['parametros.status'] }}
        </div>
      </div>

      <div class="f1">
        <LabelFromYup
          name="visibilidade_tipo"
          required
          :schema="schema"
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
        Criar relatório
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
</template>
