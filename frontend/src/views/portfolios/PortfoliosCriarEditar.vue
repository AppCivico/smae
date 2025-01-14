<script setup>
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { portfolio as schema } from '@/consts/formSchemas';
import months from '@/consts/months';
import niveisRegionalizacao from '@/consts/niveisRegionalizacao';
import { useAlertStore } from '@/stores/alert.store';
import { useObservadoresStore } from '@/stores/observadores.store.ts';
import { useOrgansStore } from '@/stores/organs.store';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  portfolioId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const observadoresStore = useObservadoresStore();
const ÓrgãosStore = useOrgansStore();
const portfolioStore = usePortfolioStore();
const mesesDisponíveis = months.map((x, i) => ({ nome: x, id: i + 1 }));
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(portfolioStore);
const { órgãosComoLista } = storeToRefs(ÓrgãosStore);
const {
  lista: gruposDeObservadores,
  chamadasPendentes: gruposDeObservadoresPendentes,
  erro: erroNosDadosDeObservadores,
} = storeToRefs(observadoresStore);

portfolioStore.$reset();

async function onSubmit(values) {
  try {
    let r;
    const msg = props.portfolioId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.portfolioId) {
      r = await portfolioStore.salvarItem(values, props.portfolioId);
    } else {
      r = await portfolioStore.salvarItem(values);
    }
    if (r) {
      alertStore.success(msg);
      portfolioStore.$reset();
      router.push({ name: route.meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

if (props.portfolioId) {
  portfolioStore.buscarItem(props.portfolioId);
}

ÓrgãosStore.getAll().finally(() => {
  chamadasPendentes.value.emFoco = false;
});

observadoresStore.buscarTudo();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Portfolios' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <Form
    v-if="órgãosComoLista?.length"
    v-slot="{ errors, isSubmitting, setFieldValue, values }"
    :validation-schema="schema"
    :initial-values="itemParaEdicao"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="titulo"
          :schema="schema"
        />
        <Field
          name="titulo"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="titulo"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="descricao"
          :schema="schema"
        />
        <Field
          name="descricao"
          as="textarea"
          rows="5"
          class="inputtext light mb1"
          maxlength="500"
          :class="{ 'error': errors.descricao }"
        />
        <ErrorMessage
          name="descricao"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="data_criacao"
          :schema="schema"
        />
        <Field
          name="data_criacao"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.data_criacao }"
          maxlength="10"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('data_criacao', $v || null); }"
        />
        <ErrorMessage
          name="data_criacao"
          class="error-msg"
        />
      </div>

      <div class="f1 mb1">
        <LabelFromYup
          name="nivel_maximo_tarefa"
          :schema="schema"
        />
        <Field
          name="nivel_maximo_tarefa"
          type="number"
          min="1"
          max="32"
          class="inputtext light mb1"
          :class="{ 'error': errors.nivel_maximo_tarefa }"
        />
        <ErrorMessage
          name="nivel_maximo_tarefa"
          class="error-msg"
        />
      </div>

      <div class="f1 mb1">
        <LabelFromYup
          name="nivel_regionalizacao"
          :schema="schema"
        />
        <Field
          name="nivel_regionalizacao"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.nivel_regionalizacao }"
        >
          <option
            v-for="nível in Object.values(niveisRegionalizacao)"
            :key="nível.id"
            :value="nível.id"
          >
            {{ nível.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="nivel_regionalizacao"
          class="error-msg"
        />
      </div>
    </div>

    <div class="f1 mb1">
      <label
        for="modelo-clonagem"
        class="flex center"
      >
        <Field
          id="modelo-clonagem"
          name="modelo_clonagem"
          type="checkbox"
          :value="true"
          class="inputcheckbox"
          :disabled="props.portfolioId ? true : false"
        />
        <LabelFromYup
          as="span"
          name="modelo_clonagem"
          :schema="schema"
          class="mb0"
        />
      </label>

      <ErrorMessage
        name="modelo_clonagem"
        class="error-msg"
      />
    </div>

    <div class="f1 mb2">
      <LabelFromYup
        :schema="schema"
        name="orgaos"
      />

      <AutocompleteField
        name="orgaos"
        :controlador="{ busca: '', participantes: values.orgaos || [] }"
        :grupo="órgãosComoLista"
        label="sigla"
      />
      <ErrorMessage
        name="orgaos"
        class="error-msg"
      />
      <div
        v-if="chamadasPendentes?.emFoco"
        class="spinner"
      >
        Carregando
      </div>
    </div>

    <div class="f1 mb2">
      <LabelFromYup
        :schema="schema"
        name="orcamento_execucao_disponivel_meses"
      />
      <AutocompleteField
        name="orcamento_execucao_disponivel_meses"
        :controlador="{
          busca: '',
          participantes: values.orcamento_execucao_disponivel_meses || []
        }"
        :grupo="mesesDisponíveis"
        label="nome"
      />
      <ErrorMessage
        name="orcamento_execucao_disponivel_meses"
        class="error-msg"
      />
    </div>

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup
          name="grupo_portfolio"
          :schema="schema"
          class="tc300"
        />

        <AutocompleteField
          :disabled="gruposDeObservadoresPendentes.lista"
          name="grupo_portfolio"
          :controlador="{
            busca: '',
            participantes: values.grupo_portfolio || []
          }"
          :class="{
            error: erroNosDadosDeObservadores,
            loading: gruposDeObservadoresPendentes.lista
          }"
          :grupo="gruposDeObservadores"
          label="titulo"
        />
        <ErrorMessage
          name="grupo_portfolio"
          class="error-msg"
        />
      </div>
    </div>

    <pre v-ScrollLockDebug>values.grupo_portfolio:{{ values.grupo_portfolio }}</pre>

    <div
      v-if="erroNosDadosDeObservadores"
      class="error p1"
    >
      <div class="error-msg">
        {{ erroNosDadosDeObservadores }}
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
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
