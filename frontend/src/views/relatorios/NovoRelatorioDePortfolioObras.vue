<script setup>
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

import { relatórioDePortfolioObras as schema } from '@/consts/formSchemas';
import nulificadorTotal from '@/helpers/nulificadorTotal';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useGruposTematicosStore } from '@/stores/gruposTematicos.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store.ts';
import { useRegionsStore } from '@/stores/regions.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';

const ÓrgãosStore = useOrgansStore();
const portfolioObrasStore = usePortfolioObraStore();
const { organs, órgãosComoLista } = storeToRefs(ÓrgãosStore);

const alertStore = useAlertStore();
const authStore = useAuthStore();
const relatoriosStore = useRelatoriosStore();
const gruposTematicosStore = useGruposTematicosStore();
const regionsStore = useRegionsStore();
const route = useRoute();
const router = useRouter();

const { regiõesPorNível } = storeToRefs(regionsStore);
const { tiposDeVisibilidade } = storeToRefs(relatoriosStore);

const initialValues = {
  fonte: 'Obras',
  parametros: {
    grupo_tematico_id: null,
    orgao_responsavel_id: null,
    periodo: null,
    portfolio_id: null,
    regiao_id: null,
  },
  visibilidade_tipo: null,
};

async function onSubmit(values) {
  const carga = nulificadorTotal(values);

  async function enviar() {
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

  const tipoSelecionado = tiposDeVisibilidade.value
    .find((item) => item.tipo === values.visibilidade_tipo);

  if (tipoSelecionado?.requer_confirmacao) {
    alertStore.confirmAction(tipoSelecionado.mensagem_confirmacao, enviar);
  } else {
    await enviar();
  }
}

function iniciar() {
  portfolioObrasStore.buscarTudo();
  ÓrgãosStore.getAll();
  gruposTematicosStore.buscarTudo();
  regionsStore.getAll();
  relatoriosStore.buscarTiposDeVisibilidade();
}

iniciar();
</script>

<template>
  <CabecalhoDePagina :formulario-sujo="false" />

  <Form
    v-slot="{ errors, isSubmitting, setFieldValue }"
    :validation-schema="schema"
    :initial-values="initialValues"
    @submit="onSubmit"
  >
    <input
      type="hidden"
      name="fonte"
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
          name="visibilidade_tipo"
          :schema="schema"
          required
        />
        <Field
          name="visibilidade_tipo"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors['visibilidade_tipo'] }"
          :aria-busy="relatoriosStore.chamadasPendentes.tiposDeVisibilidade"
        >
          <option
            value=""
            disabled
          >
            Selecionar
          </option>
          <option
            v-for="item in tiposDeVisibilidade"
            :key="item.tipo"
            :value="item.tipo"
            :disabled="item.tipo === 'meu_orgao' && !authStore.user?.orgao_id"
          >
            {{ item.label }}
          </option>
        </Field>
        <div
          v-if="errors['visibilidade_tipo']"
          class="error-msg"
        >
          {{ errors['visibilidade_tipo'] }}
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
