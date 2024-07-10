<script setup>
import { relatórioDeStatus as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store.ts';
import { useObrasStore } from '@/stores/obras.store.js';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import CheckClose from '../../components/CheckClose.vue';

const alertStore = useAlertStore();
const portfolioObrasStore = usePortfolioObraStore();
const obrasStore = useObrasStore();
const relatoriosStore = useRelatoriosStore();
const route = useRoute();
const router = useRouter();

const initialValues = {
  fonte: 'ObraStatus',
  parametros: {
      tipo: 'MDO',
      portfolio_id: null,
    projeto_id: null,
    periodo_inicio: null,
    periodo_fim: null,
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
    const r = await relatoriosStore.insert(carga);

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

portfolioObrasStore.buscarTudo();
obrasStore.buscarTudo();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título || $route.name }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
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
            loading: portfolioObrasStore.chamadasPendentes.lista
          }"
          :disabled="portfolioObrasStore.chamadasPendentes.lista"
          @change="setFieldValue('parametros.projeto_id', null)"
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
            loading: obrasStore.chamadasPendentes.lista
          }"
          :disabled="obrasStore.chamadasPendentes.lista
            || !obrasStore.obrasPorPortfolio?.[values.parametros.portfolio_id]?.length"
        >
          <option :value="null">
            Selecionar
          </option>
          <option
            v-for="item in (!values.parametros.portfolio_id
              ? obrasStore.lista
              : obrasStore.obrasPorPortfolio[values.parametros.portfolio_id] || []
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

    <div class="flex g2 mb2">
      <div class="f1">
        <LabelFromYup
          name="periodo_inicio"
          :schema="schema.fields.parametros"
        />
        <Field
          id="periodo_inicio"
          name="parametros.periodo_inicio"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametros.periodo_inicio'] }"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('parametros.periodo_inicio', $v || null); }"
        />
        <div
          v-if="errors['parametros.periodo_inicio']"
          class="error-msg"
        >
          {{ errors['parametros.periodo_inicio'] }}
        </div>
      </div>
      <div class="f1">
        <LabelFromYup
          name="periodo_fim"
          :schema="schema.fields.parametros"
        />
        <Field
          id="periodo_fim"
          name="parametros.periodo_fim"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametros.periodo_fim'] }"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('parametros.periodo_fim', $v || null); }"
        />
        <div
          v-if="errors['parametros.periodo_fim']"
          class="error-msg"
        >
          {{ errors['parametros.periodo_fim'] }}
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
      <div
        v-if="errors['salvar_arquivo']"
        class="error-msg"
      >
        {{ errors['salvar_arquivo'] }}
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
