<script setup>
import { relatórioSemestralOuAnual as schema } from "@/consts/formSchemas";
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

let { loading } = storeToRefs(relatoriosStore);

const listaDeSemestres = [
  'Primeiro',
  'Segundo',
];

const listaDePeríodos = [
  'Semestral',
  'Anual',
];

current.value = {
  fonte: 'Indicadores',
  parametros: {
    tipo: 'Analitico',
    pdm_id: 0,
    meta_id: 0,
    ano: 2003,
    periodo: '',
    semestre: '',
  },
  salvar_arquivo: false,
};

async function onSubmit(values) {
  try {
    var msg;
    var r;

    if (values.parametros.periodo === 'Anual') {
      values.parametros.semestre = undefined;
    }

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
  <Form @submit="onSubmit" :validation-schema="schema" :initial-values="current" v-slot="{ errors, isSubmitting, values }">
      <div class="flex g2 mb2">
        <div class="f1">
            <label class="label"><abbr title="Programa de metas">PdM</abbr> <span class="tvermelho">*</span></label>
            <Field name="parametros.pdm_id" as="select" class="inputtext light
            mb1" :class="{ 'error': errors['parametros.pdm_id'] }" :disabled="loading">
                <option value="">Selecionar</option>
                <option v-for="item in PdMStore.PdM" :value="item.id"
                :key="item.id">{{ item.nome }}</option>
            </Field>
            <div class="error-msg">{{ errors['parametros.pdm_id'] }}</div>
        </div>
        <div class="f1">
            <label for="ano" class="label">ano <span class="tvermelho">*</span></label>
            <Field placeholder="2003" name="parametros.ano" id="ano" type="number" class="inputtext light mb1"
            :class="{ 'error': errors['parametro.ano'] }" min="2003" />
            <div class="error-msg">{{ errors['parametros.ano'] }}</div>
        </div>

        <div class="f1">
            <label for="periodo" class="label">periodo <span class="tvermelho">*</span></label>
            <Field placeholder="01/2003" name="parametros.periodo" id="periodo" as="select" class="inputtext light mb1"
            :class="{ 'error': errors['parametros.periodo'] }">
                <option value="">Selecionar</option>
                <option v-for="item, k in listaDePeríodos" :value="item" :key="k"
                :selected="k == current.parametros?.periodo">
                  {{ item }}
                </option>
            </Field>
            <div class="error-msg">{{ errors['parametros.periodo'] }}</div>
        </div>

        <div class="f1">
            <label for="semestre" class="label">
              semestre
              <span v-show="values.parametros.periodo === 'Semestral'" class="tvermelho">*</span>
            </label>
            <Field placeholder="01/2003" name="parametros.semestre" id="semestre" as="select" class="inputtext light mb1"
            :class="{ 'error': errors['parametros.semestre'] }" :disabled="values.parametros.periodo !== 'Semestral'">
                <option value="">Selecionar</option>
                <option v-for="item, k in listaDeSemestres" :value="item" :key="k"
                :selected="k == current.parametros?.semestre">
                  {{ item }}
                </option>
            </Field>
            <div class="error-msg">{{ errors['parametros.semestre'] }}</div>
        </div>
      </div>

      <div class="mb2">
          <div class="pl2">
            <label class="block mb1">
              <Field name="parametros.tipo" type="radio" value="Consolidado"
              class="inputcheckbox" :class="{ 'error': errors['parametros.tipo'] }" />
              <span>Consolidado</span>
            </label>
            <label class="block mb1">
              <Field name="parametros.tipo" type="radio" value="Analitico"
              class="inputcheckbox" :class="{ 'error': errors['parametros.tipo'] }" />
              <span>Analítico</span>
            </label>
          </div>
          <div class="error-msg">{{ errors['parametros.tipo'] }}</div>
      </div>

      <div class="mb2">
          <div class="pl2">
            <label class="block">
                <Field name="salvar_arquivo" type="checkbox"
                :value="true" class="inputcheckbox" />
                <span :class="{ 'error': errors.salvar_arquivo }">Persistir o relatório</span>
            </label>
          </div>
        <div class="error-msg">{{ errors.salvar_arquivo }}</div>
      </div>

      <div class="flex spacebetween center mb2">
          <hr class="mr2 f1"/>
          <button type="submit" class="btn big" :disabled="loading ||
          isSubmitting">
            {{ values.salvar_arquivo ? "baixar e salvar" : "apenas baixar" }}
          </button>
          <hr class="ml2 f1"/>
      </div>
  </Form>
</template>
