<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm, useIsFormDirty,
} from 'vee-validate';
import {
  computed, defineOptions, onMounted, ref,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import configEtapas from '@/consts/configEtapas';
import { etapasProjeto as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';
import { usePortfolioStore } from '@/stores/portfolios.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store';

const alertStore = useAlertStore();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const etapasProjetosStore = useEtapasProjetosStore(route.meta.entidadeMãe);

function inicializarPortfolioStore() {
  const { entidadeMãe } = route.meta;

  if (entidadeMãe === 'projeto') {
    const store = usePortfolioStore();
    const { lista, chamadasPendentes } = storeToRefs(store);
    return { store, portfolios: lista, chamadasPendentes };
  }

  if (entidadeMãe === 'mdo' || entidadeMãe === 'obras') {
    const store = usePortfolioObraStore();
    const { lista, chamadasPendentes } = storeToRefs(store);
    return { store, portfolios: lista, chamadasPendentes };
  }

  if (entidadeMãe === 'TransferenciasVoluntarias') {
    // TransferenciasVoluntarias não usa portfolio
    return {
      store: null,
      portfolios: ref([]),
      chamadasPendentes: ref({ lista: false }),
    };
  }

  throw new Error(`entidadeMãe não suportada: ${entidadeMãe}`);
}

const {
  store: portfoliosStore,
  portfolios,
  chamadasPendentes: chamadasPendentesPortfolios,
} = inicializarPortfolioStore();

const {
  chamadasPendentes, erro, etapasPorId, listaPadrao,
} = storeToRefs(etapasProjetosStore);

const ehTransferencia = computed(() => route.meta.entidadeMãe === 'TransferenciasVoluntarias');

const contextoEtapa = computed(() => {
  if (route.meta.contextoEtapa) {
    return route.meta.contextoEtapa;
  }
  const config = configEtapas[route.meta.entidadeMãe];
  return config?.contextoEtapa || null;
});

defineOptions({ inheritAttrs: false });

const props = defineProps({
  etapaId: {
    type: Number,
    default: 0,
  },
});

const emFoco = computed(() => {
  if (props.etapaId) {
    const etapa = etapasPorId.value[props.etapaId];
    if (!etapa) return null;

    return {
      id: etapa.id,
      descricao: etapa.descricao,
      eh_padrao: etapa.eh_padrao,
      portfolio_id: etapa.portfolio?.id || null,
      etapa_padrao_id: etapa.etapa_padrao?.id || null,
    };
  }

  let ehPadraoPorContexto = true;
  if (contextoEtapa.value === 'administracao') {
    ehPadraoPorContexto = true;
  } else if (contextoEtapa.value === 'configuracoes') {
    ehPadraoPorContexto = false;
  }

  return {
    id: null,
    descricao: '',
    eh_padrao: ehPadraoPorContexto,
    portfolio_id: null,
    etapa_padrao_id: null,
  };
});

const {
  errors, handleSubmit, isSubmitting, values, setFieldValue,
} = useForm({
  initialValues: emFoco,
  validationSchema: schema,
});

const formularioSujo = useIsFormDirty();

const etapasPadraoDisponiveis = computed(() => {
  if (props.etapaId) {
    return listaPadrao.value.filter((etapa) => etapa.id !== props.etapaId);
  }
  return listaPadrao.value;
});

onMounted(() => {
  if (portfoliosStore) {
    portfoliosStore.buscarTudo();
  }

  // Etapas padrão pra preencher o select
  if (contextoEtapa.value === 'configuracoes') {
    etapasProjetosStore.buscarEtapasPadrao();
  }
});

const onSubmit = handleSubmit(async (carga) => {
  let redirect;
  if (route.meta.entidadeMãe === 'TransferenciasVoluntarias') {
    redirect = 'TransferenciasVoluntarias.etapa.listar';
  } else if (route.meta.entidadeMãe === 'mdo' || route.meta.entidadeMãe === 'obras') {
    redirect = contextoEtapa.value === 'administracao' ? 'mdo.etapasListar' : 'mdo.etapas.listar';
  } else if (route.meta.entidadeMãe === 'projeto') {
    redirect = contextoEtapa.value === 'administracao' ? 'projeto.etapasListar' : 'projeto.etapas.listar';
  }
  try {
    const msg = props.etapaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = props.etapaId
      ? await etapasProjetosStore.salvarItem(carga, props.etapaId)
      : await etapasProjetosStore.salvarItem(carga);

    if (resposta) {
      alertStore.success(msg);
      etapasProjetosStore.$reset();
      etapasProjetosStore.buscarTudo();
      router.push({ name: redirect });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function excluirEtapaDoProjeto(id) {
  alertStore.confirmAction(
    'Deseja mesmo remover esse item?',
    async () => {
      if (await etapasProjetosStore.excluirItem(id)) {
        etapasProjetosStore.$reset();
        etapasProjetosStore.buscarTudo();
        alertStore.success('Etapa removida.');

        const rotaDeEscape = route.meta?.rotaDeEscape;

        if (rotaDeEscape) {
          router.push(
            typeof rotaDeEscape === 'string'
              ? { name: rotaDeEscape }
              : rotaDeEscape,
          );
        }
      }
    },
    'Remover',
  );
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      <div
        v-if="etapaId"
        class="t12 uc w700 tamarelo"
      >
        {{ "Editar etapa" }}
      </div>
      {{ emFoco?.descricao
        ? emFoco?.descricao
        : etapaId
          ? "Etapa"
          : "Nova etapa" }}
    </h1>
    <hr class="ml2 f1">
    <CheckClose :formulario-sujo="formularioSujo" />
  </div>

  <form
    v-if="!etapaId || emFoco"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f2 mb1">
        <SmaeLabel
          name="descricao"
          :schema="schema"
        />
        <Field
          id="descricao"
          name="descricao"
          required
          type="text"
          maxlength="2048"
          class="inputtext light mb1"
          :class="{
            error: errors.descricao,
          }"
        />
        <ErrorMessage
          name="descricao"
          class="error-msg"
        />
      </div>
    </div>

    <Field
      name="eh_padrao"
      type="hidden"
      :value="contextoEtapa === 'administracao' ? true : (emFoco?.eh_padrao ?? true)"
    />

    <div
      v-if="!ehTransferencia && contextoEtapa === 'configuracoes'"
      class="flex g2 mb1"
    >
      <div class="f1 mb1">
        <SmaeLabel
          name="portfolio_id"
          :schema="schema"
        />
        <Field
          name="portfolio_id"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors.portfolio_id }"
          :disabled="chamadasPendentesPortfolios.lista"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="portfolio in portfolios"
            :key="portfolio.id"
            :value="portfolio.id"
          >
            {{ portfolio.titulo }}
          </option>
        </Field>
        <ErrorMessage
          name="portfolio_id"
          class="error-msg"
        />
      </div>

      <div class="f1 mb1">
        <SmaeLabel
          name="etapa_padrao_id"
          :schema="schema"
        />
        <Field
          name="etapa_padrao_id"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors.etapa_padrao_id }"
          :disabled="chamadasPendentes.lista"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="etapa in etapasPadraoDisponiveis"
            :key="etapa.id"
            :value="etapa.id"
          >
            {{ etapa.descricao }}
          </option>
        </Field>
        <ErrorMessage
          name="etapa_padrao_id"
          class="error-msg"
        />
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
          : null
        "
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </form>

  <div
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >
    Carregando
  </div>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
