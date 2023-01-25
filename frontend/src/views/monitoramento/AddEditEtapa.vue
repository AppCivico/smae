<script setup>
import { etapaDeMonitoramento as schema } from '@/consts/formSchemas';
import fieldToDate from '@/helpers/fieldToDate';
import { router } from '@/router';
import { useAlertStore, useCiclosStore, useEditModalStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { Field, Form } from 'vee-validate';
import { useRoute } from 'vue-router';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const { meta_id } = route.params;
const { cron_id } = route.params;
const { etapa_id } = route.params;

const CiclosStore = useCiclosStore();
const { SingleEtapa } = storeToRefs(CiclosStore);
CiclosStore.getEtapaById(cron_id, etapa_id);

async function onSubmit(values) {
  try {
    let msg;
    let r;

    if (values.inicio_real) {
      values.inicio_real = fieldToDate(values.inicio_real);
    } else {
      values.inicio_real = null;
    }
    if (values.termino_real) {
      values.termino_real = fieldToDate(values.termino_real);
    } else {
      values.termino_real = null;
    }

    r = await CiclosStore.updateEtapa(SingleEtapa.value.id, values);
    msg = 'Dados salvos com sucesso!';

    if (r == true) {
      CiclosStore.clear();
      CiclosStore.getMetaByIdCron(meta_id);
      CiclosStore.getCronogramasActiveByParent(meta_id, 'meta_id');
      await router.push(`/monitoramento/cronograma/${meta_id}`);
      alertStore.success(msg);
      editModalStore.clear();
    }
  } catch (error) {
    alertStore.error(error);
  }
}
async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    router.go(-1);
    editModalStore.clear();
    alertStore.clear();
  });
}
function maskDate(el) {
  const kC = event.keyCode;
  let data = el.target.value.replace(/[^0-9/]/g, '');
  if (kC != 8 && kC != 46) {
    if (data.length == 2) {
      el.target.value = data += '/';
    } else if (data.length == 5) {
      el.target.value = data += '/';
    } else {
      el.target.value = data;
    }
  }
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <div class="t48">
      <strong>Atualizar</strong><br>{{ SingleEtapa?.titulo }}
    </div>
    <hr class="ml2 f1">
    <button
      class="btn round ml2"
      @click="checkClose"
    >
      <svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg>
    </button>
  </div>
  <template v-if="!(SingleEtapa?.loading || SingleEtapa?.error)&&SingleEtapa?.id">
    <Form
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      :initial-values="SingleEtapa"
      @submit="onSubmit"
    >
      <div class="flex g2 mb2">
        <div class="f1">
          <label class="label tc300">Início Previsto</label>
          <div class="t13">
            {{ SingleEtapa.inicio_previsto }}
          </div>
        </div>
        <div class="f1">
          <label class="label tc300">Término Previsto</label>
          <div class="t13">
            {{ SingleEtapa.termino_previsto }}
          </div>
        </div>
      </div>
      <div class="flex g2">
        <div class="f1">
          <label class="label">Início Real <span class="tvermelho">*</span></label>
          <Field
            name="inicio_real"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.inicio_real }"
            maxlength="10"
            @keyup="maskDate"
          />
          <div class="error-msg">
            {{ errors.inicio_real }}
          </div>
        </div>
        <div class="f1">
          <label class="label">Término real </label>
          <Field
            name="termino_real"
            type="text"
            class="inputtext light mb1"
            :class="{ 'error': errors.termino_real }"
            maxlength="10"
            @keyup="maskDate"
          />
          <div class="error-msg">
            {{ errors.termino_real }}
          </div>
        </div>
      </div>
      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          class="btn big"
          :disabled="isSubmitting"
        >
          Salvar
        </button>
        <hr class="ml2 f1">
      </div>
    </Form>
  </template>
  <template v-else-if="SingleEtapa?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-else-if="SingleEtapa?.error||error">
    <div class="error p1">
      <div class="error-msg">
        {{ SingleEtapa.error??error }}
      </div>
    </div>
  </template>
  <template v-else>
    <span>Etapa não encontrada</span>
  </template>
</template>
