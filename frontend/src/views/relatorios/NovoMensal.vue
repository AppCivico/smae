<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { relatórioMensal as schema } from '@/consts/formSchemas';
import months from '@/consts/months';
import {
  useAlertStore, usePaineisStore, usePdMStore, useRelatoriosStore, useTagsStore,
} from '@/stores';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CheckClose from '../../components/CheckClose.vue';

const TagsStore = useTagsStore();
const { filtradasPorPdM } = storeToRefs(TagsStore);
const alertStore = useAlertStore();
const PdMStore = usePdMStore();
const PainéisStore = usePaineisStore();
const relatoriosStore = useRelatoriosStore();
const route = useRoute();
const router = useRouter();
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
  const carga = values;
  try {
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
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título || $route.name }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
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
          :class="{
            loading: loading,
            error: errors['parametros.pdm_id']
          }"
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

    <!--div class="mb2" v-if="filtradasPorPdM(values.parametros.pdm_id).length">
          <div class="pl2">
            <label class="label">Tags</label>
            <AutocompleteField :controlador="tags" :grupo="filtradasPorPdM(values.parametros.pdm_id)" label="descricao" />
          </div>
      </div-->

    <div class="mb2">
      <LabelFromYup
        name="tags"
        :schema="schema.fields.parametros"
      />
      <AutocompleteField
        name="parametros.tags"
        :controlador="{ busca: '', participantes: values.parametros.tags || [] }"
        :grupo="filtradasPorPdM(values.parametros.pdm_id)"
        label="descricao"
        :class="{
          error: errors['parametros.tags'],
          loading: filtradasPorPdM(values.parametros.pdm_id)?.loading,
        }"
      />

      <div
        v-if="errors['parametros.tags']"
        class="error-msg"
      >
        {{ errors['parametros.tags'] }}
      </div>
    </div>

    <div class="mb2">
      <LabelFromYup
        name="paineis"
        :schema="schema.fields.parametros"
      />
      <AutocompleteField
        name="parametros.paineis"
        :controlador="{ busca: '', participantes: values.parametros.paineis || [] }"
        :grupo="PainéisStore.Paineis"
        label="nome"
        :class="{
          error: errors['parametros.paineis'],
          loading: PainéisStore.Paineis?.loading,
        }"
      />

      <div
        v-if="errors['parametros.paineis']"
        class="error-msg"
      >
        {{ errors['parametros.paineis'] }}
      </div>
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
