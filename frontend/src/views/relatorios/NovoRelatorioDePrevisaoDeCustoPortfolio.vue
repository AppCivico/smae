<script setup>
import MigalhasDePao from '@/components/MigalhasDePao.vue';
import { relatórioDePrevisãoDeCustoPortfolio as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const projetosStore = useProjetosStore();
const alertStore = useAlertStore();
const portfolioStore = usePortfolioStore();
const relatoriosStore = useRelatoriosStore();
const route = useRoute();
const router = useRouter();
const { current, loading } = storeToRefs(relatoriosStore);

const currentYear = new Date().getFullYear();

const initialValues = computed(() => ({
  fonte: 'ProjetoPrevisaoCusto',
  parametros: {
    ano: currentYear,
    portfolio_id: 0,
    projeto_id: null,
  },
  eh_publico: null,
}));

async function onSubmit(values) {
  const carga = values;
  try {
    if (carga.parametros.projeto_id === null) {
      delete carga.parametros.projeto_id;
    }

    const r = await relatoriosStore.insert(carga);
    const msg = 'Relatório em processamento, acompanhe na tela de listagem';

    if (r === true) {
      alertStore.success(msg);

      if (route.meta?.rotaDeEscape) {
        await router.push({ name: route.meta.rotaDeEscape });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function iniciar() {
  portfolioStore.buscarTudo();
  projetosStore.buscarTudo();
}

iniciar();
</script>
<template>
  <MigalhasDePao class="mb1" />

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
          @change="setFieldValue('parametros.projeto_id', null)"
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
          :disabled="projetosStore.chamadasPendentes.lista
            || !projetosStore.projetosPorPortfolio?.[values.parametros.portfolio_id]?.length"
        >
          <option :value="null">
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
          name="ano"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.ano"
          type="text"
          class="inputtext light mb2"
          maxlength="4"
          :class="{ 'error': errors['parametros.ano'] }"
        />
        <div
          v-if="errors['parametros.ano']"
          class="error-msg"
        >
          {{ errors['parametros.ano'] }}
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
            loading: projetosStore.chamadasPendentes.lista
          }"
          :disabled="projetosStore.chamadasPendentes.lista"
        >
          <option
            value=""
            disabled
          >
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

    <FormErrorsList :errors="errors" />

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
