<script setup>
import { Dashboard } from '@/components';
import { órgão as schema } from '@/consts/formSchemas';
import { router } from '@/router';
import { useAlertStore, useOrgansStore } from '@/stores';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  Form,
} from 'vee-validate';
import { useRoute } from 'vue-router';

const alertStore = useAlertStore();
const route = useRoute();
const { id } = route.params;

const organsStore = useOrgansStore();
const {
  tempOrgans, organTypes, nívelDoÓrgãoMaisProfundo, órgãosPorNível,
} = storeToRefs(organsStore);
organsStore.clear();
organsStore.getAllTypes();

let title = 'Cadastro de orgão';
if (id) {
  title = 'Editar orgão';
  organsStore.getById(id);
}

async function onSubmit(values) {
  try {
    let msg;
    let r;
    if (id && tempOrgans.value.id) {
      r = await organsStore.update(tempOrgans.value.id, values);
      msg = 'Dados salvos com sucesso!';
    } else {
      r = await organsStore.insert(values);
      msg = 'Item adicionado com sucesso!';
    }
    if (r == true) {
      await router.push('/orgaos');
      alertStore.success(msg);
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', '/orgaos');
}
async function checkDelete(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => { if (await organsStore.delete(id)) router.push('/orgaos'); }, 'Remover');
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
    <template v-if="!(tempOrgans?.loading || tempOrgans?.error)">
      <Form
        v-slot="{ setFieldValue, errors, isSubmitting, values }"
        :validation-schema="schema"
        :initial-values="tempOrgans"
        @submit="onSubmit"
      >
        <div class="flex g2">
          <div class="f1">
            <label class="label">Descrição <span class="tvermelho">*</span></label>
            <Field
              name="descricao"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.descricao }"
            />
            <ErrorMessage
              class="error-msg"
              name="descricao"
            />
          </div>
        </div>
        <div class="flex g2">
          <div class="f1">
            <label class="label">Tipo <span class="tvermelho">*</span></label>
            <Field
              name="tipo_orgao_id"
              as="select"
              class="inputtext light mb1"
              :class="{ 'error': errors.tipo_orgao_id }"
            >
              <option value="">
                Selecionar
              </option>
              <template v-if="organTypes.length">
                <option
                  v-for="tipo in organTypes"
                  :key="tipo.id"
                  :value="tipo.id"
                >
                  {{ tipo.descricao }}
                </option>
              </template>
            </Field>
            <ErrorMessage
              class="error-msg"
              name="tipo_orgao_id"
            />
          </div>
          <div class="f1">
            <label class="label">Sigla <span class="tvermelho">*</span></label>
            <Field
              name="sigla"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.sigla }"
            />
            <ErrorMessage
              class="error-msg"
              name="sigla"
            />
          </div>
        </div>

        <div class="flex g2">
          <div class="f1">
            <label class="label">Nível <span class="tvermelho">*</span></label>
            <Field
              name="nivel"
              type="number"
              step="1"
              class="inputtext light mb1"
              :class="{ 'error': errors.nivel }"
              :max="nívelDoÓrgãoMaisProfundo + 1"
              min="1"
              @change="($event) => {
        setFieldValue('nivel', Number($event.target.value));
        setFieldValue('parente_id', null);
      }"
            />
            <ErrorMessage
              class="error-msg"
              name="nivel"
            />
          </div>
          <div class="f1">
            <label class="label">
              Subordinado ao órgão
              <span
                v-if="values.nivel > 1"
                class="tvermelho"
              >*</span>
            </label>
            <Field
              name="parente_id"
              as="select"
              class="inputtext light mb1"
              :class="{ 'error': errors.parente_id }"
              :disabled="!(values.nivel > 1)"
            >
              <option :value="null">
                Selecionar
              </option>
              <option
                v-for="órgão in (órgãosPorNível[values.nivel - 1] || [])  "
                :key="órgão.id"
                :value="órgão.id"
                :title="órgão.descricao?.length > 36 ? órgão.descricao : null"
              >
                {{ órgão.sigla }} - {{ órgão.descricao }}
              </option>
            </Field>
            <ErrorMessage
              class="error-msg"
              name="parente_id"
            />
          </div>
        </div>

        <FormErrorsList :errors="errors" />

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
    <template v-if="tempOrgans.id">
      <button
        class="btn amarelo big"
        @click="checkDelete(tempOrgans.id)"
      >
        Remover item
      </button>
    </template>
    <template v-if="tempOrgans?.loading">
      <span class="spinner">Carregando</span>
    </template>
    <template v-if="tempOrgans?.error">
      <div class="error p1">
        <div class="error-msg">
          {{ tempOrgans.error ?? error }}
        </div>
      </div>
    </template>
  </Dashboard>
</template>
