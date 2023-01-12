<script setup>
// import AutocompleteField from '@/components/AutocompleteField.vue';
import { relatórioMensal as schema } from '@/consts/formSchemas';
import months from '@/consts/months';
import monthAndYearToDate from '@/helpers/monthAndYearToDate';
import { router } from '@/router';
import {
  useAlertStore, usePaineisStore, usePdMStore, useRelatoriosStore, useTagsStore
} from '@/stores';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const TagsStore = useTagsStore();
const { filtradasPorPdM } = storeToRefs(TagsStore);

const alertStore = useAlertStore();
const PdMStore = usePdMStore();
const PainéisStore = usePaineisStore();
const relatoriosStore = useRelatoriosStore();
const route = useRoute();
const { current } = storeToRefs(relatoriosStore);

const { loading } = storeToRefs(relatoriosStore);

current.value = {
  fonte: 'MonitoramentoMensal',
  parametros: {
    tipo: 'Analitico',
    pdm_id: 0,
    ano: 2003,
    tags: [],
    paineis: [],
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

TagsStore.getAll();

onMounted(() => {
  PdMStore.getAll().then(() => {
    const currentPdM = PdMStore.PdM.find((x) => !!x.ativo);
    if (currentPdM?.id) {
      loading.value = false;
      current.value.parametros.pdm_id = currentPdM.id;
    }
  });

  PainéisStore.getAll();
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
          class="inputtext light mb1"
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
          for="mes"
          class="label"
        >
          mês <span class="tvermelho">*</span>
        </label>
        <Field
          v-model="current.parametros.mes"
          name="parametros.mes"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametros.mes'] }"
          :disabled="loading"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item, k in months"
            :key="k"
            :value="k + 1"
          >
            {{ item }}
          </option>
        </Field>
        <div class="error-msg">
          {{ errors['parametros.mes'] }}
        </div>
      </div>
      <div class="f1">
        <label
          for="ano"
          class="label"
        >
          ano <span class="tvermelho">*</span>
        </label>
        <Field
          id="ano"
          placeholder="2003"
          name="parametros.ano"
          type="number"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametro.ano'] }"
          min="2003"
        />
        <div class="error-msg">
          {{ errors['parametros.ano'] }}
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

    <!--div class="mb2" v-if="filtradasPorPdM(values.parametros.pdm_id).length">
          <div class="pl2">
            <label class="label">Tags</label>
            <AutocompleteField :controlador="tags" :grupo="filtradasPorPdM(values.parametros.pdm_id)" label="descricao" />
          </div>
      </div-->

    <div
      v-if="filtradasPorPdM(values.parametros.pdm_id)?.length"
      class="mb2"
    >
      <div class="label">
        Tags
      </div>
      <template v-if="filtradasPorPdM(values.parametros.pdm_id)?.loading">
        <span class="spinner">Carregando</span>
      </template>
      <template v-if="filtradasPorPdM(values.parametros.pdm_id).length">
        <label
          v-for="item in filtradasPorPdM(values.parametros.pdm_id)"
          :key="item.id"
          class="block mb1"
        >
          <Field
            name="parametros.tags"
            class="inputcheckbox"
            type="checkbox"
            :class="{ 'error': errors['parametros.tags'] }"
            :value="item.id"
            :checked="values.parametros.tags && values.parametros.tags.includes(item.id)"
          /><span>{{ item.descricao }}</span>
        </label>
        <div class="error-msg">
          {{ errors['parametros.tags'] }}
        </div>
      </template>
    </div>

    <!--div class="mb2" v-if="PainéisStore.Paineis?.length">
          <div class="pl2">
            <label class="label">Painéis</label>
            <AutocompleteField :controlador="paineis" :grupo="PainéisStore.Paineis" label="descricao" />
          </div>
      </div-->

    <div
      v-if="PainéisStore.Paineis?.length"
      class="mb2"
    >
      <div class="label">
        Painéis
      </div>
      <template v-if="PainéisStore.Paineis?.loading">
        <span class="spinner">Carregando</span>
      </template>
      <template v-if="PainéisStore.Paineis.length">
        <label
          v-for="item in PainéisStore.Paineis"
          :key="item.id"
          class="block mb1"
        >
          <Field
            name="parametros.paineis"
            class="inputcheckbox"
            type="checkbox"
            :class="{ 'error': errors['parametros.paineis'] }"
            :value="item.id"
            :checked="values.parametros.paineis && values.parametros.paineis.includes(item.id)"
          /><span>{{ item.nome }}</span>
        </label>
        <div class="error-msg">
          {{ errors['parametros.paineis'] }}
        </div>
      </template>
    </div>

    <hr>

    <div class="mb2 mt2">
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
