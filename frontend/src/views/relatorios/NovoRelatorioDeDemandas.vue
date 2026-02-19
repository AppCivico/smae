<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, useForm,
} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

import { relatórioDeDemandas as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useAreasTematicasStore } from '@/stores/areasTematicas.store';
import { useOrgansStore } from '@/stores/organs.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';

const alertStore = useAlertStore();
const relatoriosStore = useRelatoriosStore();
const ÓrgãosStore = useOrgansStore();
const AreasTematicasStore = useAreasTematicasStore();

const route = useRoute();
const router = useRouter();

const { órgãosComoLista } = storeToRefs(ÓrgãosStore);
const { lista: areasTematicasComoLista } = storeToRefs(AreasTematicasStore);

const statusOptions = ['Registro', 'Validacao', 'Publicado', 'Encerrado'];

const valoresIniciais = {
  fonte: 'Demandas',
  parametros: {
    status: [],
    data_registro_inicio: null,
    data_registro_fim: null,
    orgao_id: null,
    area_tematica_id: null,
  },
  eh_publico: null,
};

const {
  errors, handleSubmit, isSubmitting, setFieldValue,
} = useForm({
  initialValues: valoresIniciais,
  validationSchema: schema,
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    const msg = 'Relatório em processamento, acompanhe na tela de listagem';

    if (await relatoriosStore.insert(valoresControlados)) {
      alertStore.success(msg);
      router.push({ name: route.meta.rotaDeEscape });
    }
  } catch (error) {
    alertStore.error(error);
  }
});

ÓrgãosStore.getAll();
AreasTematicasStore.buscarTudo();
</script>
<template>
  <CabecalhoDePagina :formulario-sujo="false" />

  <p class="texto--explicativo">
    Relatório de demandas com informações de status, responsáveis, projeto e localização.
  </p>

  <form
    :disabled="isSubmitting"
    @submit.prevent="onSubmit"
  >
    <Field
      name="fonte"
      type="hidden"
      value="Demandas"
    />

    <div class="mb2">
      <LabelFromYup
        name="parametros.status"
        :schema="schema.fields.parametros"
        required
      />
      <div class="flex flexwrap g2">
        <label
          v-for="status in statusOptions"
          :key="status"
          class="block"
        >
          <Field
            type="checkbox"
            name="parametros.status"
            :value="status"
          />
          {{ status }}
        </label>
      </div>
      <ErrorMessage
        class="error-msg"
        name="parametros.status"
      />
    </div>

    <div class="flex flexwrap g2 mb2">
      <div class="f1">
        <LabelFromYup
          name="parametros.data_registro_inicio"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.data_registro_inicio"
          type="date"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.data_registro_inicio'],
          }"
          @change="!$event.target.value
            ? setFieldValue('parametros.data_registro_inicio',null)
            : null"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="parametros.data_registro_inicio"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="parametros.data_registro_fim"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.data_registro_fim"
          type="date"
          class="inputtext light mb1"
          :class="{
            error: errors['parametros.data_registro_fim'],
          }"
          @change="!$event.target.value
            ? setFieldValue('parametros.data_registro_fim',null)
            : null"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="parametros.data_registro_fim"
        />
      </div>
    </div>

    <div class="flex flexwrap g2 mb2">
      <div class="f1">
        <LabelFromYup
          name="parametros.orgao_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.orgao_id"
          as="select"
          class="inputtext light"
          :class="{
            error: errors['parametros.orgao_id'],
            loading: ÓrgãosStore.chamadasPendentes?.lista,
          }"
          :disabled="isSubmitting || ÓrgãosStore.chamadasPendentes?.lista"
        >
          <option :value="null">
            Todos os órgãos
          </option>
          <option
            v-for="orgao in órgãosComoLista"
            :key="orgao.id"
            :value="orgao.id"
          >
            {{ orgao.sigla }} - {{ orgao.descricao }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg"
          name="parametros.orgao_id"
        />
      </div>

      <div class="f1">
        <LabelFromYup
          name="parametros.area_tematica_id"
          :schema="schema.fields.parametros"
        />
        <Field
          name="parametros.area_tematica_id"
          as="select"
          class="inputtext light"
          :class="{
            error: errors['parametros.area_tematica_id'],
            loading: AreasTematicasStore.chamadasPendentes?.lista,
          }"
          :disabled="isSubmitting || AreasTematicasStore.chamadasPendentes?.lista"
        >
          <option :value="null">
            Todas as áreas
          </option>
          <option
            v-for="area in areasTematicasComoLista"
            :key="area.id"
            :value="area.id"
          >
            {{ area.nome }}
          </option>
        </Field>
        <ErrorMessage
          class="error-msg"
          name="parametros.area_tematica_id"
        />
      </div>
    </div>

    <div class="flex flexwrap g2 mb2">
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
          }"
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
        <ErrorMessage
          class="error-msg"
          name="eh_publico"
        />
      </div>
    </div>

    <SmaeFieldsetSubmit
      :erros="errors"
      :esta-carregando="isSubmitting"
    >
      <button
        type="submit"
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
      >
        Criar relatório
      </button>
    </SmaeFieldsetSubmit>
  </form>
</template>
