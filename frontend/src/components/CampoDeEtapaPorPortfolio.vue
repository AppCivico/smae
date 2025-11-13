<script lang="ts" setup>
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { computed, onMounted, watch } from 'vue';

import { campoEtapaPorPortfolio as schema } from '@/consts/formSchemas';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store';

interface Etapa {
  id: number;
  descricao: string;
  portfolio_id?: number;
}

type Props = {
  modelValue?: number;
  readonly?: boolean;
};

type Emits = {
  (event: 'update:modelValue', items: number): void
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const etapasStore = useEtapasProjetosStore();
const portfolioStore = usePortfolioObraStore();

const {
  errors, setFieldValue, values,
} = useForm({
  validationSchema: schema,
  initialValues: {
    portfolio_id: 0,
    etapa_id: props.modelValue || 0,
  },
});

const portfoliosLista = computed(() => portfolioStore.lista || []);

const etapasFiltradas = computed<Etapa[]>(() => {
  if (!values.portfolio_id || values.portfolio_id === 0) {
    return [];
  }

  return etapasStore.lista as Etapa[];
});

onMounted(() => {
  portfolioStore.buscarTudo({}, true);
  etapasStore.buscarTudo();
});

watch(() => values.portfolio_id, (novoPortfolio, antigoPortfolio) => {
  if (novoPortfolio !== antigoPortfolio) {
    setFieldValue('etapa_id', 0);
    etapasStore.buscarTudo({ portfolio_id: novoPortfolio, eh_padrao: false });
  }
});

watch(() => values.etapa_id, (novoValor) => {
  emit('update:modelValue', novoValor);
});

</script>

<template>
  <div class="f1 mb1">
    <SmaeLabel
      name="portfolio_id"
      :schema="schema"
    />

    <Field
      name="portfolio_id"
      as="select"
      class="inputtext light mb1"
      :readonly="readonly"
      :disabled="readonly"
      :aria-disabled="readonly"
      :class="{
        error: errors.portfolio_id,
        loading: portfolioStore.chamadasPendentes.lista
      }"
      @change="() => setFieldValue('etapa_id', 0)"
    >
      <option :value="0">
        Selecionar
      </option>

      <option
        v-for="item in portfoliosLista"
        :key="item.id"
        :value="item.id"
      >
        {{ item.titulo }}
      </option>
    </Field>

    <ErrorMessage
      class="error-msg mb1"
      name="portfolio_id"
    />
  </div>

  <div class="f1 mb1">
    <SmaeLabel
      name="etapa_id"
      :schema="schema"
    />

    <Field
      name="etapa_id"
      as="select"
      :readonly="readonly"
      :aria-disabled="readonly"
      class="inputtext light mb1"
      :class="{
        error: errors.etapa_id,
        loading: etapasStore.chamadasPendentes?.lista
      }"
      :disabled="readonly || !values.portfolio_id || values.portfolio_id === 0"
    >
      <option :value="0">
        Selecionar
      </option>

      <option
        v-for="etapa in etapasFiltradas"
        :key="etapa.id"
        :value="etapa.id"
      >
        {{ etapa.descricao }}
      </option>
    </Field>

    <ErrorMessage
      class="error-msg mb1"
      name="etapa_id"
    />
  </div>
</template>
