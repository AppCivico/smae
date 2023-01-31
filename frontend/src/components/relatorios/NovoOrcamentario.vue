<script setup>
import { relatórioOrçamentário as schema } from '@/consts/formSchemas';
import maskMonth from '@/helpers/maskMonth';
import monthAndYearToDate from '@/helpers/monthAndYearToDate';
import { router } from '@/router';
import { useAlertStore, usePdMStore, useRelatoriosStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const alertStore = useAlertStore();
const PdMStore = usePdMStore();
const relatoriosStore = useRelatoriosStore();
const route = useRoute();
const { current } = storeToRefs(relatoriosStore);

const { loading } = storeToRefs(relatoriosStore);

current.value = {
  fonte: 'Orcamento',
  parametros: {
    tipo: 'Analitico',
    pdm_id: 0,
    meta_id: 0,
    tags: [],
    inicio: '',
    fim: '',
    orgaos: [],
  },
  salvar_arquivo: false,
};

async function onSubmit(values) {
  try {
    let msg;
    let r;

    values.parametros.inicio = monthAndYearToDate(values.parametros.inicio);
    values.parametros.fim = monthAndYearToDate(values.parametros.fim);
    if (!values.salvar_arquivo) {
      values.salvar_arquivo = false;
    }

    r = await relatoriosStore.insert(values);
    msg = 'Dados salvos com sucesso!';

    if (r == true) {
      alertStore.success(msg);

      if (values.salvar_arquivo && route.meta?.rotaDeEscape) {
        await router.push(route.meta.rotaDeEscape);
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
}

onMounted(() => {
  PdMStore.getAll().then(() => {
    const currentPdM = PdMStore.PdM.find((x) => !!x.ativo);
    if (currentPdM?.id) {
      loading.value = false;
      current.value.parametros.pdm_id = currentPdM.id;
    }
  });
});
</script>

<template>
  <Form
    v-slot="{ errors, isSubmitting, values }"
    :validation-schema="schema"
    :initial-values="current"
    @submit="onSubmit"
  >
    <div class="flex g2 mb2">
      <div class="f1">
        <label class="label">
          <abbr title="Programa de metas">PdM</abbr>
          <span class="tvermelho">*</span>
        </label>
        <Field
          v-model="current.parametros.pdm_id"
          name="parametros.pdm_id"
          as="select"
          class="inputtext light
            mb1"
          :class="{ 'error': errors['parametros.pdm_id'] }"
          :disabled="loading"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in PdMStore.PdM"
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
          v-model="current.parametros.inicio"
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
          v-model="current.parametros.fim"
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
        :disabled="loading ||
          isSubmitting"
      >
        {{ values.salvar_arquivo ? "baixar e salvar" : "apenas baixar" }}
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>
</template>
