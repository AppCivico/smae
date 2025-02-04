<script setup>
import { Field, Form, useIsFormDirty } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import CheckClose from '@/components/CheckClose.vue';
import MigalhasDePao from '@/components/MigalhasDePao.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import { relatórioDeProjeto as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';

const alertStore = useAlertStore();
const portfolioStore = usePortfolioStore();
const projetosStore = useProjetosStore();
const relatóriosStore = useRelatoriosStore();
const route = useRoute();
const router = useRouter();

const formularioSujo = useIsFormDirty();

const initialValues = {
  fonte: 'Projeto',
  parametros: {
    projeto_id: null,
  },
  salvar_arquivo: false,
};

async function onSubmit(values) {
  const carga = values;

  try {
    if (!carga.salvar_arquivo) {
      carga.salvar_arquivo = false;
    }

    const msg = 'Dados salvos com sucesso!';
    const r = await relatóriosStore.insert(carga);

    if (r === true) {
      alertStore.success(msg);

      if (carga.salvar_arquivo && route.meta?.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
}

portfolioStore.buscarTudo();
projetosStore.buscarTudo();
</script>

<template>
  <MigalhasDePao class="mb1" />

  <div class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <CheckClose :formulario-sujo="formularioSujo" />
  </div>

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
    </div>

    <div class="mb2">
      <div class="pl2">
        <label class="block">
          <Field
            name="salvar_arquivo"
            type="checkbox"
            :value="true"
            class="inputcheckbox"
          />
          <span :class="{ 'error': errors.salvar_arquivo }">Salvar relatório no sistema</span>
        </label>
      </div>
      <div class="error-msg">
        {{ errors.salvar_arquivo }}
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
        {{ values.salvar_arquivo ? "baixar e salvar" : "apenas baixar" }}
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
</template>
