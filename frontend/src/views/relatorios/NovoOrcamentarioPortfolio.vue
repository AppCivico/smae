<script setup>
import {
  Field, Form, useIsFormDirty,
} from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MigalhasDePao from '@/components/MigalhasDePao.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import { relatórioOrçamentárioPortfolio as schema } from '@/consts/formSchemas';
import maskMonth from '@/helpers/maskMonth';
import monthAndYearToDate from '@/helpers/monthAndYearToDate';
import { useAlertStore } from '@/stores/alert.store';
// Mantendo comportamento legado
// eslint-disable-next-line import/no-cycle
import { usePdMStore } from '@/stores/pdm.store';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';

const portfolioStore = usePortfolioStore();
const alertStore = useAlertStore();
const PdMStore = usePdMStore();
const relatoriosStore = useRelatoriosStore();
const route = useRoute();
const router = useRouter();

const initialValues = computed(() => ({
  fonte: 'ProjetoOrcamento',
  parametros: {
    tipo: 'Analitico',
    inicio: '',
    fim: '',
    portfolio_id: 0,
    projeto_id: 0,
  },
}));

const formularioSujo = useIsFormDirty();

async function onSubmit(values) {
  const carga = values;
  try {
    carga.parametros.inicio = monthAndYearToDate(carga.parametros.inicio);
    carga.parametros.fim = monthAndYearToDate(carga.parametros.fim);

    const r = await relatoriosStore.insert(carga);
    const msg = 'Relatório em processamento, acompanhe na tela de listagem';

    if (r === true) {
      alertStore.success(msg);

      if (route.meta?.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
}

portfolioStore.buscarTudo();
</script>

<template>
  <MigalhasDePao class="mb1" />

  <header class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <CheckClose :formulario-sujo="formularioSujo" />
  </header>

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
          name="eh_publico"
          :schema="schema"
          required
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
          v-if="errors['parametros.eh_publico']"
          class="error-msg"
        >
          {{ errors['parametros.eh_publico'] }}
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
        :disabled="PdMStore.PdM?.loading ||
          isSubmitting"
      >
        Criar relatório
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
</template>
