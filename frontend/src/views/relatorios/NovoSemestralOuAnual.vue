<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { relatórioSemestralOuAnual as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useMetasStore } from '@/stores/metas.store';
import { usePdMStore } from '@/stores/pdm.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const alertStore = useAlertStore();
const PdMStore = usePdMStore();
const MetasStore = useMetasStore();
const relatoriosStore = useRelatoriosStore();
const route = useRoute();
const router = useRouter();
const { current } = storeToRefs(relatoriosStore);

const { loading } = storeToRefs(relatoriosStore);

const listaDeSemestres = ['Primeiro', 'Segundo'];
const listaDePeríodos = ['Semestral', 'Anual'];

const currentOptions = ref({
  fonte: route.meta.fonteParaRelatório,
  parametros: {
    tipo: 'Analitico',
    pdm_id: 0,
    meta_id: 0,
    metas_ids: [],
    ano: new Date().getFullYear(),
    periodo: '',
    semestre: '',
  },
  salvar_arquivo: false,
});

async function onSubmit(values) {
  const carga = values;
  try {
    if (carga.parametros.periodo === 'Anual') {
      delete carga.parametros.semestre;
    }

    if (!carga.salvar_arquivo) {
      carga.salvar_arquivo = false;
    }

    const r = await relatoriosStore.insert(carga);
    const msg = 'Dados salvos com sucesso!';

    if (r === true) {
      alertStore.success(msg);
      if (values.salvar_arquivo && route.meta?.rotaDeEscape) {
        router.push({ name: route.meta.rotaDeEscape });
      }
    }
  } catch (error) {
    alertStore.error(error);
  }
}

onMounted(async () => {
  if (!MetasStore.activePdm.id) {
    await MetasStore.getPdM();
  }

  PdMStore.getAll().then(() => {
    const currentPdM = PdMStore.PdM.find((x) => !!x.ativo);
    if (currentPdM?.id) {
      loading.value = false;
      current.value.parametros.pdm_id = currentPdM.id;
    }
  });

  watch(() => currentOptions.value.parametros.pdm_id, (newId, oldId) => {
    if (newId !== oldId) {
      MetasStore.getfilteredMetasByPdM(newId);
    }
  });
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
    :initial-values="currentOptions"
    @submit="onSubmit"
  >
    <div class="flex g2 mb2">
      <div class="f1">
        <label
          v-if="route.meta.entidadeMãe === 'pdm'"
          class="label"
        >
          <abbr title="Programa de metas">PdM</abbr>&nbsp;<span class="tvermelho">*</span>
        </label>
        <label
          v-else
          class="label"
        >
          {{ $route.meta.tituloSingular }}&nbsp;<span class="tvermelho">*</span>
        </label>
        <Field
          v-model="currentOptions.parametros.pdm_id"
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
          for="ano"
          class="label"
        >ano <span class="tvermelho">*</span></label>
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

      <div class="f1">
        <label
          for="periodo"
          class="label"
        >período <span class="tvermelho">*</span></label>
        <Field
          id="periodo"
          placeholder="01/2003"
          name="parametros.periodo"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametros.periodo'] }"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item, k in listaDePeríodos"
            :key="k"
            :value="item"
            :selected="k == currentOptions.parametros?.periodo"
          >
            {{ item }}
          </option>
        </Field>
        <div class="error-msg">
          {{ errors['parametros.periodo'] }}
        </div>
      </div>

      <div class="f1">
        <label
          for="semestre"
          class="label"
        >
          semestre
          <span
            v-show="values.parametros.periodo === 'Semestral'"
            class="tvermelho"
          >*</span>
        </label>
        <Field
          id="semestre"
          placeholder="01/2003"
          name="parametros.semestre"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors['parametros.semestre'] }"
          :disabled="values.parametros.periodo !== 'Semestral'"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item, k in listaDeSemestres"
            :key="k"
            :value="item"
            :selected="k == currentOptions.parametros?.semestre"
          >
            {{ item }}
          </option>
        </Field>
        <div class="error-msg">
          {{ errors['parametros.semestre'] }}
        </div>
      </div>
    </div>
    <div class="mb2">
      <label
        for="metas"
        class="label"
      >
        Metas
      </label>
      <AutocompleteField
        id="metas"
        name="parametros.metas_ids"
        :controlador="{ busca: '', participantes: values.parametros.metas_ids || [] }"
        label="titulo"
        :grupo="MetasStore.Metas"
        :class="{ error: errors['parametros.metas'], loading: MetasStore.Metas?.loading }"
      />
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
