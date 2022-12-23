<script setup>
import { relatórioOrçamentário as schema } from "@/consts/formSchemas";
import maskMonth from '@/helpers/maskMonth';
import { router } from '@/router';
import { useAlertStore, usePdMStore, useRelatoriosStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { onMounted } from 'vue';

import monthAndYearToDate from '../../helpers/monthAndYearToDate';

const relatoriosStore = useRelatoriosStore();

const PdMStore = usePdMStore();
const { current } = storeToRefs(relatoriosStore);
const alertStore = useAlertStore();

console.debug('relatoriosStore.insert', relatoriosStore.insert);

let { loading } = storeToRefs(relatoriosStore);

current.value.fonte = 'Orcamento';

async function onSubmit(values) {
  console.debug('values', values);

  try {
    var msg;
    var r;

    values.parametros.inicio = monthAndYearToDate(values.parametros.inicio);
    values.parametros.fim = monthAndYearToDate(values.parametros.fim);
    if (!values.salvar_arquivo) {
      values.salvar_arquivo = false;
    }

    r = await relatoriosStore.insert(values);
    msg = 'Dados salvos com sucesso!';

    if (r == true) {
      await router.push('/relatorios/orcamentarios');
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}

// function setFieldSave() {
//   console.debug('current.value.salvar_arquivo', current.value.salvar_arquivo);
//   current.value.salvar_arquivo = true;
// }

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
      <!--Field type="hidden" value="Orcamento" name="fonte" /-->
      <div class="flex g2 mb2">
        <div class="f1">
            <label class="label"><abbr title="Programa de metas">PdM</abbr> <span class="tvermelho">*</span></label>
            <Field name="parametros.pdm_id" as="select" class="inputtext light
            mb1" :class="{ 'error': errors['parametros.pdm_id'] }" :disabled="loading" v-model="current.parametros.pdm_id">
                <option value="">Selecionar</option>
                <option v-for="item in PdMStore.PdM" :value="item.id"
                :key="item.id">{{ item.nome }}</option>
            </Field>
            <div class="error-msg">{{ errors['parametros.pdm_id'] }}</div>
        </div>
        <div class="f1">
            <label for="inicio" class="label">mês/ano início <span class="tvermelho">*</span></label>
            <Field placeholder="01/2003" name="parametros.inicio" id="inicio" type="text" class="inputtext light mb1"
            :class="{ 'error': errors['parametro.inicio'] }" maxlength="7" @keyup="maskMonth" v-model="current.parametros.inicio" />
            <div class="error-msg">{{ errors['parametros.inicio'] }}</div>
        </div>
        <div class="f1">
            <label for="fim" class="label">mês/ano final <span class="tvermelho">*</span></label>
            <Field placeholder="01/2003" name="parametros.fim" id="fim" type="text" class="inputtext light mb1"
            :class="{ 'error': errors['parametros.fim'] }" maxlength="7" @keyup="maskMonth" v-model="current.parametros.fim" />
            <div class="error-msg">{{ errors['parametros.fim'] }}</div>
        </div>
      </div>

      <div class="mb2">
          <div class="pl2">
            <label class="block mb1">
              <Field name="parametros.tipo" type="radio" value="Consolidado"
              class="inputcheckbox" v-model="current.parametros.tipo" :class="{ 'error': errors['parametro.tipo'] }" />
              <span>Consolidado</span>
            </label>
            <label class="block mb1">
              <Field name="parametros.tipo" type="radio" value="Analitico"
              class="inputcheckbox" v-model="current.parametros.tipo" :class="{ 'error': errors['parametro.tipo'] }" />
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
            {{ values.salvar_arquivo ? "exportar e salvar" : "exportar" }}
          </button>
          <hr class="ml2 f1"/>
      </div>
  </Form>
</template>
