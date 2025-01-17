<script setup>
import { Field, Form, useIsFormDirty } from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CheckClose from '@/components/CheckClose.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import MigalhasDePao from '@/components/MigalhasDePao.vue';
import { useAlertStore } from '@/stores/alert.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import maskMonth from '@/helpers/maskMonth';
import monthAndYearToDate from '@/helpers/monthAndYearToDate';
import dateIgnorarTimezone from '@/helpers/dateIgnorarTimezone';
import { relatórioOrçamentárioPlanosSetoriais as schema } from '@/consts/formSchemas';

const route = useRoute();
const alertStore = useAlertStore();

const PlanosSetoriaisStore = usePlanosSetoriaisStore();
const relatoriosStore = useRelatoriosStore();
const router = useRouter();

const formularioSujo = useIsFormDirty();

const currentYear = new Date().getFullYear();

const initialValues = computed(() => ({
  fonte: 'PSOrcamento',
  parametros: {
    tipo: 'Analitico',
    pdm_id: 0,
    portfolio_id: 0,
    meta_id: 0,
    tags: [],
    inicio: dateIgnorarTimezone(`${currentYear}-01-01`, 'MM/yyyy'),
    fim: dateIgnorarTimezone(`${currentYear}-12-01`, 'MM/yyyy'),
    orgaos: [],
  },
  salvar_arquivo: false,
}));

async function onSubmit(values) {
  const carga = values;
  try {
    carga.parametros.inicio = monthAndYearToDate(carga.parametros.inicio);
    carga.parametros.fim = monthAndYearToDate(carga.parametros.fim);
    if (!carga.salvar_arquivo) {
      carga.salvar_arquivo = false;
    }

    const r = await relatoriosStore.insert(carga);
    const msg = 'Dados salvos com sucesso!';

    if (r === true) {
      alertStore.success(msg);

      if (carga.salvar_arquivo && route.meta?.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
}

PlanosSetoriaisStore.buscarTudo();
</script>

<template>
  <MigalhasDePao class="mb1" />

  <div class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <CheckClose :formulario-sujo="formularioSujo" />
  </div>

  <Form
    v-slot="{ errors, isSubmitting, values }"
    :validation-schema="schema"
    :initial-values="initialValues"
    @submit="onSubmit"
  >
    <div class="flex g2 mb2">
      <div class="f1">
        <!--<label class="label">
          <abbr title="Plano Setorial">Plano Setorial</abbr>
          <span class="tvermelho">*</span>-->
        <label
          for="pdm_id"
          class="label"
        >Plano Setorial
          <span class="tvermelho">
            *
          </span>
        </label>
        <Field
          name="parametros.pdm_id"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametros.pdm_id'] }"
          :disabled="PlanosSetoriaisStore.PlanosSetoriais?.loading"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in PlanosSetoriaisStore.lista"
            :key="item.id"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <div class="error-msg">
          {{ errors['parametros.pdm_id'] }}
        </div>
      </div>
      <div class="f1">
        <label
          for="inicio"
          class="label"
        >mês/ano início <span class="tvermelho">*</span></label>
        <Field
          id="inicio"
          placeholder="01/2003"
          name="parametros.inicio"
          type="text"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametro.inicio'] }"
          maxlength="7"
          @keyup="maskMonth"
        />
        <div class="error-msg">
          {{ errors['parametros.inicio'] }}
        </div>
      </div>
      <div class="f1">
        <label
          for="fim"
          class="label"
        >mês/ano final <span class="tvermelho">*</span></label>
        <Field
          id="fim"
          placeholder="01/2003"
          name="parametros.fim"
          type="text"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametros.fim'] }"
          maxlength="7"
          @keyup="maskMonth"
        />
        <div class="error-msg">
          {{ errors['parametros.fim'] }}
        </div>
      </div>
    </div>

    <div class="mb2">
      <div class="pl2">
        <label class="block mb1">
          <Field
            name="parametros.tipo"
            type="radio"
            value="Consolidado"
            class="inputcheckbox"
            :class="{ 'error': errors['parametros.tipo'] }"
          />
          <span>Consolidado</span>
        </label>
        <label class="block mb1">
          <Field
            name="parametros.tipo"
            type="radio"
            value="Analitico"
            class="inputcheckbox"
            :class="{ 'error': errors['parametros.tipo'] }"
          />
          <span>Analítico</span>
        </label>
      </div>
      <div class="error-msg">
        {{ errors['parametros.tipo'] }}
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

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        type="submit"
        class="btn big"
        :disabled="PlanosSetoriaisStore.PlanosSetoriais?.loading ||
          isSubmitting"
      >
        {{ values.salvar_arquivo ? "baixar e salvar" : "apenas baixar" }}
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
</template>
