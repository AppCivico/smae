<script setup>
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import { relatórioOrçamentárioPlanosSetoriais as schema } from '@/consts/formSchemas';
import dateIgnorarTimezone from '@/helpers/dateIgnorarTimezone';
import maskMonth from '@/helpers/maskMonth';
import monthAndYearToDate from '@/helpers/monthAndYearToDate';
import { useAlertStore } from '@/stores/alert.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { Field, Form, useIsFormDirty } from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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
}));

async function onSubmit(values) {
  const carga = values;
  try {
    carga.parametros.inicio = monthAndYearToDate(carga.parametros.inicio);
    carga.parametros.fim = monthAndYearToDate(carga.parametros.fim);

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

PlanosSetoriaisStore.buscarTudo();
</script>

<template>
  <MigalhasDePao class="mb1" />
  <header class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <CheckClose :formulario-sujo="formularioSujo" />
  </header>

  <Form
    v-slot="{ errors, isSubmitting }"
    :validation-schema="schema"
    :initial-values="initialValues"
    @submit="onSubmit"
  >
    <Field
      name="parametros.tipo_pdm"
      type="hidden"
      :value="$route.meta.tipoPdmParaRelatorio"
    />

    <div class="flex g2 mb2">
      <div class="f1">
        <label
          for="parametros.pdm_id"
          class="label"
        >{{ $route.meta.tituloSingular }}
          <span class="tvermelho">
            *
          </span>
        </label>
        <Field
          id="parametros.pdm_id"
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
            loading: PlanosSetoriaisStore.PlanosSetoriais?.loading
          }"
          :disabled="PlanosSetoriaisStore.PlanosSetoriais?.loading"
        >
          <option :value="null">
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

    <div class="mb2">
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
      <div class="error-msg">
        {{ errors['parametros.tipo'] }}
      </div>
    </div>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        type="submit"
        class="btn big"
        :disabled="PlanosSetoriaisStore.PlanosSetoriais?.loading || isSubmitting"
      >
        Criar relatório
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
</template>
