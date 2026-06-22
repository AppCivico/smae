<script setup>
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

import { relatórioDeProjeto as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';

const alertStore = useAlertStore();
const authStore = useAuthStore();
const portfolioStore = usePortfolioStore();
const projetosStore = useProjetosStore();
const relatóriosStore = useRelatoriosStore();
const { tiposDeVisibilidade } = storeToRefs(relatóriosStore);
const route = useRoute();
const router = useRouter();

const initialValues = {
  fonte: 'Projeto',
  parametros: {
    projeto_id: null,
  },
  visibilidade_tipo: null,
};

async function onSubmit(values) {
  async function enviar() {
    try {
      const msg = 'Relatório em processamento, acompanhe na tela de listagem';
      const r = await relatóriosStore.insert(values);
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
  projetosStore.buscarTudo();
  relatóriosStore.buscarTiposDeVisibilidade();
}

iniciar();
</script>

<template>
  <CabecalhoDePagina :formulario-sujo="false" />

  <Form
    v-slot="{ errors, isSubmitting, setFieldValue, values }"
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
          @change="setFieldValue('parametros.projeto_id', 0)"
        >
          <option :value="0">
            Selecionar
          </option>
          <option
            v-for="item in portfolioStore.lista"
            :key="item.id"
            :value="item.id"
            :disabled="!projetosStore.projetosPorPortfolio?.[item.id]?.length"
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
        <LabelFromYup
          name="projeto_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.projeto_id"
          as="select"
          class="inputtext light
            mb1"
          :class="{
            error: errors['parametros.projeto_id'],
            loading: projetosStore.chamadasPendentes.lista
          }"
          :disabled="projetosStore.chamadasPendentes.lista"
        >
          <option :value="0">
            Selecionar
          </option>
          <option
            v-for="item in (!values.parametros.portfolio_id
              ? projetosStore.lista
              : projetosStore.projetosPorPortfolio[values.parametros.portfolio_id] || []
            )"
            :key="item.id"
            :value="item.id"
          >
            {{ item.id }} - {{ item.nome }}
          </option>
        </Field>
        <div
          v-if="errors['parametros.projeto_id']"
          class="error-msg"
        >
          {{ errors['parametros.projeto_id'] }}
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
          :aria-busy="relatóriosStore.chamadasPendentes.tiposDeVisibilidade"
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
