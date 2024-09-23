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
const { current, loading } = storeToRefs(relatoriosStore);

const listaDePeríodos = ['Corrente', 'Anterior'];

const initialValues = computed(() => ({
  fonte: 'Obras',
  parametros: {
    periodo_ano: 'Corrente',
    portfolio_id: 0,
    obra_id: null,
  },
  salvar_arquivo: false,
}));

async function onSubmit(values) {
  const carga = values;
  try {
    if (!carga.salvar_arquivo) {
      carga.salvar_arquivo = false;
    }

    if (carga.parametros.obra_id === null) {
      delete carga.parametros.obra_id
    }

    const r = await relatoriosStore.insert(carga);
    const msg = 'Dados salvos com sucesso!';

    if (r === true) {
      alertStore.success(msg);

      if (carga.salvar_arquivo && route.meta?.rotaDeEscape) {
        await router.push({ name: route.meta.rotaDeEscape });
      }
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
          @change="setFieldValue('parametros.obra_id', null)"
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
          name="obra_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.obra_id"
          as="select"
          class="inputtext light
            mb1"
          :class="{
            error: errors['parametros.obra_id'],
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
          v-if="errors['parametros.obra_id']"
          class="error-msg"
        >
          {{ errors['parametros.obra_id'] }}
        </div>
      </div>
    </div>

    <div class="f1">
      <label
        for="periodo_ano"
        class="label"
      >periodo <span class="tvermelho">*</span></label>
      <Field
        id="periodo_ano"
        placeholder="01/2003"
        name="parametros.periodo_ano"
        as="select"
        class="inputtext light mb1"
        :class="{ 'error': errors['parametros.periodo_ano'] }"
      >
        <option value="">
          Selecionar
        </option>
        <option
          v-for="item, k in listaDePeríodos"
          :key="k"
          :value="item"
          :selected="k == current.parametros?.periodo_ano"
        >
          {{ item }}
        </option>
      </Field>
      <div
        v-if="errors['parametros.periodo_ano']"
        class="error-msg"
      >
        {{ errors['parametros.periodo_ano'] }}
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
        type="submit"
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
      >
        {{ values.salvar_arquivo ? "baixar e salvar" : "apenas baixar" }}
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
</template>
