<script setup>
import { ref, unref } from 'vue';
import { Dashboard } from '@/components';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { router } from '@/router';
import { storeToRefs } from 'pinia';

import { useEditModalStore, useAlertStore, usePaineisGruposStore } from '@/stores';

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();
const route = useRoute();
const { grupo_id } = route.params;

const PaineisGruposStore = usePaineisGruposStore();
const { singlePaineisGrupos } = storeToRefs(PaineisGruposStore);
PaineisGruposStore.clear();

const virtualCopy = ref({
  ativo: '1',
});

let title = 'Cadastro de grupo de painel';
if (grupo_id) {
  title = 'Editar grupo de painel';
  PaineisGruposStore.getById(grupo_id);
}

const buscaMeta = ref('');

const schema = Yup.object().shape({
  nome: Yup.string().required('Preencha o nome'),
  ativo: Yup.boolean().nullable(),
});

async function onSubmit(values) {
  try {
    let msg;
    let r;

    values.ativo = !!values.ativo;

    if (grupo_id) {
      r = await PaineisGruposStore.update(grupo_id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await PaineisGruposStore.insert(values);
      msg = 'Item adicionado com sucesso!';
    }
    if (r == true) {
      await router.push('/paineis-grupos');
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', '/paineis-grupos');
}
async function checkDelete(grupo_id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => { if (await PaineisGruposStore.delete(grupo_id)) router.push('/paineis-grupos'); }, 'Remover');
}
async function checkUnselect(grupo_id, meta_id) {
  alertStore.confirmAction('Deseja mesmo esse item?', async () => {
    try {
      let r;
      const values = {
        metas: Object.values(singlePaineisGrupos.value.painel_conteudo).map((x) => Number(x.meta_id)).filter((x) => x != meta_id),
      };
      r = await PaineisGruposStore.selectMetas(grupo_id, values);
      if (r == true) {
        PaineisGruposStore.clear();
        PaineisGruposStore.getById(grupo_id);
      } else {
        throw r;
      }
    } catch (error) {
      alertStore.error(error);
    }
  }, 'Remover');
}
function removeChars(x) {
  x.target.value = x.target.value.replace(/[^a-zA-Z0-9,]/g, '');
}
function toggleAccordeon(t) {
  t.target.closest('.tzaccordeon').classList.toggle('active');
}
</script>
<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <h1>{{ title }}</h1>
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
    <template v-if="!(singlePaineisGrupos?.loading || singlePaineisGrupos?.error)">
      <Form
        v-slot="{ errors, isSubmitting }"
        :validation-schema="schema"
        :initial-values="grupo_id ? singlePaineisGrupos : virtualCopy"
        @submit="onSubmit"
      >
        <div class="mb1">
          <label class="block">
            <Field
              name="ativo"
              type="checkbox"
              value="1"
              class="inputcheckbox"
            /><span :class="{ 'error': errors.ativo }">Grupo ativo</span>
          </label>
          <div class="error-msg">
            {{ errors.ativo }}
          </div>
        </div>
        <div class="flex g2">
          <div class="f2">
            <label class="label">Nome <span class="tvermelho">*</span></label>
            <Field
              name="nome"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.nome }"
            />
            <div class="error-msg">
              {{ errors.nome }}
            </div>
          </div>
        </div>
        <div class="flex spacebetween center mb2">
          <hr class="mr2 f1">
          <button
            class="btn big"
            :disabled="isSubmitting"
          >
            Salvar grupo
          </button>
          <hr class="ml2 f1">
        </div>
      </Form>
    </template>
    <template v-if="singlePaineisGrupos?.loading">
      <span class="spinner">Carregando</span>
    </template>
    <template v-if="singlePaineisGrupos?.error || error">
      <div class="error p1">
        <div class="error-msg">
          {{ singlePaineisGrupos.error ?? error }}
        </div>
      </div>
    </template>

    <hr class="mt1 mb2">

    <template v-if="singlePaineisGrupos.id">
      <button
        class="btn amarelo big"
        @click="checkDelete(singlePaineisGrupos.id)"
      >
        Remover grupo
      </button>
    </template>
  </Dashboard>
</template>
