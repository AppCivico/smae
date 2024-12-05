<script setup>
import { storeToRefs } from 'pinia';
import {
  ErrorMessage,
  Field,
  Form,
  useIsFormDirty,
} from 'vee-validate';
import { vMaska } from 'maska';
import { useRoute } from 'vue-router';
import { Dashboard } from '@/components';
import { órgão as schema } from '@/consts/formSchemas';
import { router } from '@/router';
import { useAlertStore, useOrgansStore } from '@/stores';

const route = useRoute();
const alertStore = useAlertStore();
const formularioSujo = useIsFormDirty();
const organsStore = useOrgansStore();

const { id } = route.params;

const {
  tempOrgans, organTypes, nívelDoÓrgãoMaisProfundo, órgãosPorNível,
} = storeToRefs(organsStore);
organsStore.clear();
organsStore.getAllTypes();

if (id) {
  organsStore.getById(id);
} else {
  organsStore.getAll();
}

async function onSubmit(values) {
  try {
    let message = '';

    const valores = {
      ...values,
      cnpj: values.cnpj === '' ? null : values.cnpj,
    };

    if (id && tempOrgans.value.id) {
      await organsStore.update(tempOrgans.value.id, valores);
      message = 'Dados salvos com sucesso!';
    } else {
      await organsStore.insert(valores);
      message = 'Item adicionado com sucesso!';
    }

    alertStore.success(message);
    router.push({ name: 'gerenciarÓrgãos' });
  } catch (error) {
    alertStore.error(error);
  }
}
</script>

<template>
  <Dashboard>
    <MigalhasDePão />

    <div class="flex spacebetween center mt2 mb2">
      <TítuloDePágina />

      <hr class="ml2 f1">

      <CheckClose :formulario-sujo="formularioSujo" />
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

        <div class="flex g2 flexwrap">
          <div class="f1">
            <label class="label">Secretário</label>
            <Field
              name="secretario_responsavel"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.secretario_responsavel }"
            />
            <ErrorMessage
              class="error-msg"
              name="secretario_responsavel"
            />
          </div>
          <div class="f1">
            <label class="label">email</label>
            <Field
              name="email"
              type="email"
              class="inputtext light mb1"
              :class="{ 'error': errors.email }"
            />
            <ErrorMessage
              class="error-msg"
              name="email"
            />
          </div>
        </div>
        <div class="flex g2 flexwrap">
          <div class="f1">
            <label class="label">CNPJ</label>
            <Field
              v-maska
              name="cnpj"
              type="text"
              class="inputtext light mb1"
              :class="{ 'error': errors.cnpj }"
              data-maska="##.###.###/####-##"
            />
            <ErrorMessage
              class="error-msg"
              name="cnpj"
            />
          </div>
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
                v-for="órgão in (órgãosPorNível[values.nivel - 1] || []) "
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
