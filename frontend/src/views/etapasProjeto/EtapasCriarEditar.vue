<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, Form, useForm,
} from 'vee-validate';
import {
  computed, defineOptions, onMounted, watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { etapasProjeto as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';
import { usePortfolioStore } from '@/stores/portfolios.store';

const alertStore = useAlertStore();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);
const etapasProjetosStore = useEtapasProjetosStore(route.meta.entidadeMãe);
const portfoliosStore = usePortfolioStore();
const {
  chamadasPendentes, erro, etapasPorId, etapasPadrao,
} = storeToRefs(etapasProjetosStore);
const { lista: portfolios } = storeToRefs(portfoliosStore);

defineOptions({ inheritAttrs: false });

const props = defineProps({
  etapaId: {
    type: Number,
    default: 0,
  },
});

const emFoco = computed(() => {
  if (props.etapaId) {
    return etapasPorId.value[props.etapaId] || null;
  }

  return {
    descricao: '',
    etapa_padrao: false,
    portfolio_id: null,
    etapa_padrao_associada_id: null,
  };
});

onMounted(() => {
  portfoliosStore.buscarTudo();
});

    return {
      id: etapa.id,
      descricao: etapa.descricao,
      eh_padrao: etapa.eh_padrao,
      portfolio_id: etapa.portfolio?.id || null,
      etapa_padrao_id: etapa.etapa_padrao?.id || null,
    };
  }

  return {
    id: null,
    descricao: '',
    eh_padrao: false,
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
    return etapasPadrao.value.filter((etapa) => etapa.id !== props.etapaId);
  }
  return etapasPadrao.value;
});

onMounted(() => {
  portfoliosStore.buscarTudo();
});

const onSubmit = handleSubmit(async (carga) => {
  let redirect;
  if (route.meta.entidadeMãe === 'TransferenciasVoluntarias') {
    redirect = 'TransferenciasVoluntarias.etapasListar';
  } else if (route.meta.entidadeMãe === 'mdo'
  || route.meta.entidadeMãe === 'obras') {
    redirect = 'mdo.etapasListar';
  } else if (route.meta.entidadeMãe === 'projeto') {
    redirect = 'projeto.etapasListar';
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
    v-slot="{ errors, isSubmitting, values, resetField }"
    :disabled="chamadasPendentes.emFoco"
    :initial-values="emFoco"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f2 mb1">
        <LabelFromYup
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

    <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup
          name="etapa_padrao"
          :schema="schema"
        />
        <label class="block mb05">
          <Field
            name="etapa_padrao"
            type="radio"
            :value="true"
            @change="() => {
              resetField('portfolio_id');
              resetField('etapa_padrao_associada_id');
            }"
          />
          Sim
        </label>
        <label class="block">
          <Field
            name="etapa_padrao"
            type="radio"
            :value="false"
          />
          Não
        </label>
        <ErrorMessage
          name="etapa_padrao"
          class="error-msg"
        />
      </div>
    </div>

    <div
      v-if="values.etapa_padrao === false"
      class="flex g2 mb1"
    >
      <div class="f1 mb1">
        <LabelFromYup
          name="portfolio_id"
          :schema="schema"
        />
        <Field
          name="portfolio_id"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors.portfolio_id }"
          :disabled="chamadasPendentes.lista"
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
        <LabelFromYup
          name="etapa_padrao_associada_id"
          :schema="schema"
        />
        <Field
          name="etapa_padrao_associada_id"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors.etapa_padrao_associada_id }"
          :disabled="chamadasPendentes.lista"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="etapa in etapasPadrao"
            :key="etapa.id"
            :value="etapa.id"
          >
            {{ etapa.descricao }}
          </option>
        </Field>
        <ErrorMessage
          name="etapa_padrao_associada_id"
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

  <button
    v-else-if="emFoco?.id && (
      temPermissãoPara('CadastroProjetoEtapa.remover'
        || route.meta.entidadeMãe === 'TransferenciasVoluntarias'
      )
    )"
    class="btn amarelo big"
    @click="excluirEtapaDoProjeto(emFoco.id)"
  >
    Remover item
  </button>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
