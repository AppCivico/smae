<script setup>
import { ref } from 'vue';
import { Form, Field } from 'vee-validate';
import * as Yup from 'yup';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { router } from '@/router';
import {
  useAuthStore, useEditModalStore, useAlertStore, useCiclosStore,
} from '@/stores';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const route = useRoute();
const { meta_id } = route.params;

const pr = defineProps(['props']);
const { props } = pr;

const CiclosStore = useCiclosStore();
const { SingleAnalise } = storeToRefs(CiclosStore);
CiclosStore.getAnalise(props.var_id, props.periodo);

const schema = Yup.object().shape({
  pedido: Yup.string().required('Preencha um motivo para a solicitação'),
});

async function onSubmit(values) {
  try {
    const v = {
      variavel_id: props.var_id,
      data_valor: props.periodo,
      pedido: values.pedido,
    };
    const r = await CiclosStore.complemento(v);
    const msg = 'Solicitação enviada!';
    if (r == true) {
      editModalStore.clear();
      alertStore.success(msg);
      CiclosStore.getMetaVars(meta_id);
    }
  } catch (error) {
    alertStore.error(error);
  }
}
function dateToTitle(d) {
  const dd = d ? new Date(d) : false;
  if (!dd) return d;
  const month = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][dd.getUTCMonth()];
  const year = dd.getUTCFullYear();
  return `${month} ${year}`;
}
function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', () => {
    editModalStore.clear();
    alertStore.clear();
  });
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h2>Solicitar complementação</h2>
    <hr class="ml2 f1">
    <span>
      <button
        class="btn round ml2"
        @click="checkClose"
      ><svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg></button>
    </span>
  </div>

  <template v-if="SingleAnalise?.variavel">
    <div class="label tamarelo mb1">
      {{ props.parent.atividade
        ? `Indicador da atividade ${props.parent.atividade.codigo} ${props.parent.atividade.titulo}`
        : props.parent.iniciativa
          ? `Indicador da iniciativa ${props.parent.iniciativa.codigo} ${props.parent.iniciativa.titulo}`
          : 'Indicador da Meta'
      }}
    </div>

    <div class="flex center mb2">
      <svg
        class="f0 tlaranja mr1"
        style="flex-basis: 2rem;"
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      ><use
        :xlink:href="`#i_${props.parent.atividade
                ? 'atividade'
                : props.parent.iniciativa
                  ? 'iniciativa'
                  : 'indicador'}`"
      /></svg>
      <div class="t20">
        <strong>{{ props.parent.indicador.codigo }} {{ props.parent.indicador.titulo }}</strong>
      </div>
    </div>

    <div class="t20">
      <strong>{{ SingleAnalise.variavel.codigo }} {{ SingleAnalise.variavel.titulo }}</strong>
    </div>
    <div class="t20 mb2">
      {{ dateToTitle(props.periodo) }}
    </div>

    <hr class="mt2 mb2">

    <Form
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      @submit="onSubmit"
    >
      <label class="label">Pedido de complementação <span class="tvermelho">*</span></label>
      <Field
        name="pedido"
        as="textarea"
        rows="5"
        class="inputtext light mb1"
        :class="{ 'error': errors.pedido }"
      />
      <div class="error-msg">
        {{ errors.pedido }}
      </div>

      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          type="submit"
          class="btn big"
          :disabled="isSubmitting"
        >
          Enviar solicitação
        </button>
        <hr class="ml2 f1">
      </div>
    </Form>
  </template>
  <template v-if="SingleAnalise?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="SingleAnalise?.error || error">
    <div class="error p1">
      <div class="error-msg">
        {{ SingleAnalise.error ?? error }}
      </div>
    </div>
  </template>
</template>
