<script setup>
import { relatórioDePortfolioObras as schema } from '@/consts/formSchemas';
import nulificadorTotal from '@/helpers/nulificadorTotal';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useGruposTematicosStore } from '@/stores/gruposTematicos.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store.ts';
import { useRegionsStore } from '@/stores/regions.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';
import CheckClose from '../../components/CheckClose.vue';

const ÓrgãosStore = useOrgansStore();
const portfolioObrasStore = usePortfolioObraStore();
const { organs, órgãosComoLista } = storeToRefs(ÓrgãosStore);

const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();
const gruposTematicosStore = useGruposTematicosStore();
const regionsStore = useRegionsStore();
const route = useRoute();
const router = useRouter();

const {
  regiõesPorNível,
} = storeToRefs(regionsStore);

const initialValues = {
  fonte: 'Obras',
  parametros: {
    grupo_tematico_id: null,
    orgao_responsavel_id: null,
    periodo: null,
    portfolio_id: null,
    regiao_id: null,
  },
  eh_publico: null,
};

async function onSubmit(values) {
  const carga = nulificadorTotal(values);

  try {
    const msg = 'Dados salvos com sucesso!';
    const r = await relatoriosStore.insert(carga);

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
  ÓrgãosStore.getAll();
  gruposTematicosStore.buscarTudo();
  regionsStore.getAll();
}

iniciar();
</script>

<template>
  <header class="flex spacebetween center mb2">
    <TituloDePagina />
    <hr class="ml2 f1">
    <CheckClose />
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
          name="parametros.portfolio_id"
          :schema="schema"
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
        >
          <option
            value=""
            disabled
            selected
          >
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
      <div class="f1 mb1">
        <LabelFromYup
          name="parametros.orgao_responsavel_id"
          :schema="schema"
        />
        <Field
          name="parametros.orgao_responsavel_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.orgao_responsavel_id'],
            loading: organs?.loading
          }"
          :disabled="!órgãosComoLista?.length"
        >
          <option
            value=""
            selected
          >
            Selecionar
          </option>
          <option
            v-for="item in órgãosComoLista"
            :key="item"
            :value="item.id"
            :title="item.descricao?.length > 36 ? item.descricao : null"
          >
            {{ item.sigla }} - {{ truncate(item.descricao, 36) }}
          </option>
        </Field>

        <div
          v-if="errors['parametros.orgao_responsavel_id']"
          class="error-msg"
        >
          {{ errors['parametros.orgao_responsavel_id'] }}
        </div>
      </div>
      <div class="f1 mb1">
        <LabelFromYup
          name="parametros.grupo_tematico_id"
          :schema="schema"
        />
        <Field
          name="parametros.grupo_tematico_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.grupo_tematico_id'],
            loading: gruposTematicosStore.chamadasPendentes.lista
          }"
          :disabled="gruposTematicosStore.chamadasPendentes.lista"
        >
          <option
            value=""
            selected
          >
            Selecionar
          </option>
          <option
            v-for="item in gruposTematicosStore.lista"
            :key="item"
            :value="item.id"
            :title="item.descricao?.length > 36 ? item.descricao : null"
          >
            {{ item.nome }}
          </option>
        </Field>

        <div
          v-if="errors['parametros.grupo_tematico_id']"
          class="error-msg"
        >
          {{ errors['parametros.grupo_tematico_id'] }}
        </div>
      </div>
    </div>

    <div class="flex g2 mb2">
      <div class="f1 mb1">
        <LabelFromYup
          name="parametros.regiao_id"
          :schema="schema"
        />
        <Field
          name="parametros.regiao_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.regiao_id'],
            loading: regionsStore.chamadasPendentes.lista
          }"
          :disabled="regionsStore.chamadasPendentes.lista"
        >
          <option
            value=""
            selected
          >
            Selecionar
          </option>
          <option
            v-for="item in regiõesPorNível[3]"
            :key="item"
            :value="item.id"
            :title="item.descricao?.length > 36 ? item.descricao : null"
          >
            {{ item.descricao }}
          </option>
        </Field>

        <div
          v-if="errors['parametros.regiao_id']"
          class="error-msg"
        >
          {{ errors['parametros.regiao_id'] }}
        </div>
      </div>
      <div class="f1">
        <LabelFromYup
          name="parametros.periodo"
          :schema="schema"
        />
        <Field
          id="periodo"
          name="parametros.periodo"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametros.periodo'] }"
          @blur="($e) => { !$e.target.value ? $e.target.value = '' : null; }"
          @update:model-value="($v) => { setFieldValue('parametros.periodo', $v || null); }"
        />
        <div
          v-if="errors['parametros.periodo']"
          class="error-msg"
        >
          {{ errors['parametros.periodo'] }}
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
            loading: portfolioObrasStore.chamadasPendentes.lista
          }"
          :disabled="portfolioObrasStore.chamadasPendentes.lista"
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
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
      >
        Criar relatório
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
</template>
