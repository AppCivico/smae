<script setup>
import { relatórioDePrevisãoDeCustoPortfolioObras as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store.ts';
import { useObrasStore } from '@/stores/obras.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CheckClose from '../../components/CheckClose.vue';

const obrasStore = useObrasStore();
const alertStore = useAlertStore();
const portfolioObrasStore = usePortfolioObraStore();
const relatoriosStore = useRelatoriosStore();
const route = useRoute();
const router = useRouter();
const { loading } = storeToRefs(relatoriosStore);

const currentYear = new Date().getFullYear();

const initialValues = computed(() => ({
  fonte: 'ObrasPrevisaoCusto',
  parametros: {
    ano: currentYear,
    portfolio_id: 0,
    projeto_id: null,
  },
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
      router.push({ name: route.meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function iniciar() {
  portfolioObrasStore.buscarTudo();
  obrasStore.buscarTudo();
}

iniciar();
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
          class="inputtext light"
          :class="{
            error: errors['eh_publico'],
            loading: loading
          }"
          :disabled="loading"
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
          v-if="errors['eh_publico']"
          class="error-msg"
        >
          {{ errors['eh_publico'] }}
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
