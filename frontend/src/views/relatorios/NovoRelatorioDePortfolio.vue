<script setup>
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import {
  Field, Form, useIsFormDirty,
} from 'vee-validate';
import MigalhasDePao from '@/components/MigalhasDePao.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import listaDeStatuses from '@/consts/projectStatuses';
import { relatórioDePortfolio as schema } from '@/consts/formSchemas';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';

const route = useRoute();
const router = useRouter();

const formularioSujo = useIsFormDirty();

const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();
const ÓrgãosStore = useOrgansStore();
const portfolioStore = usePortfolioStore();

const { organs, órgãosComoLista } = storeToRefs(ÓrgãosStore);

const initialValues = {
  fonte: 'Projetos',
  parametros: {
    status: null,
    orgao_responsavel_id: null,
    portfolio_id: null,
  },
};

async function onSubmit(values) {
  const carga = values;

  try {
    const msg = 'Relatório em processamento, acompanhe na tela de listagem';
    const r = await relatoriosStore.insert(carga);

    if (r === true) {
      alertStore.success(msg);
      router.push({ name: route.meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function iniciar() {
  portfolioStore.buscarTudo();
  ÓrgãosStore.getAll();
}

iniciar();
</script>

<template>
  <MigalhasDePao class="mb1" />

  <header class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <CheckClose :formulario-sujo="formularioSujo" />
  </header>

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
          name="eh_publico"
          required
          :schema="schema"
        />
        <Field
          name="eh_publico"
          as="select"
          class="inputtext light
            mb1"
          :class="{
            error: errors['eh_publico'],
            loading: portfolioStore.chamadasPendentes.lista
          }"
          :disabled="portfolioStore.chamadasPendentes.lista"
        >
          <option>
            Selecionar
          </option>
          <option :value="true">
            Sim
          </option>
          <option :value="false">
            Não
          </option>
        </Field>
        <div
          v-if="errors['parametros.projeto_id']"
          class="error-msg"
        >
          {{ errors['parametros.projeto_id'] }}
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
