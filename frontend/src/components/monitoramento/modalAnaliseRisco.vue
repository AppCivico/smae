<script setup>
import { default as TextEditor } from '@/components/TextEditor.vue';
import { useAlertStore, useCiclosStore, useEditModalStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { Form } from 'vee-validate';
import { ref } from 'vue';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const editModalStore = useEditModalStore();
const alertStore = useAlertStore();

const pr = defineProps(['props']);
const { props } = pr;

const CiclosStore = useCiclosStore();
const { SingleRisco } = storeToRefs(CiclosStore);

const detalhamento = ref('');
const ponto_de_atencao = ref('');
async function getAnaliseData() {
  await CiclosStore.getMetaRisco(props.ciclo_id, props.meta_id);
  detalhamento.value = SingleRisco.value.detalhamento;
  ponto_de_atencao.value = SingleRisco.value.ponto_de_atencao;
}
getAnaliseData();

async function onSubmit(values) {
  try {
    let msg;
    let r;
    const v = {
      ciclo_fisico_id: props.ciclo_id,
      meta_id: props.meta_id,
      detalhamento: detalhamento.value || '',
      ponto_de_atencao: ponto_de_atencao.value || '',
    };
    r = await CiclosStore.updateMetaRisco(v);
    msg = 'Análise de risco salva com sucesso!';
    if (r === true) {
      editModalStore.clear();
      alertStore.success(msg);
      getAnaliseData();
    }
  } catch (error) {
    alertStore.error(error);
  }
}
</script>
<template>
  <div class="flex spacebetween center">
    <h1>Análise de risco</h1>
    <hr class="ml2 f1">
    <span>
      <button
        class="btn round ml2"
        @click="props.checkClose"
      ><svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg></button>
    </span>
  </div>

  <template v-if="!SingleRisco?.loading&&!SingleRisco?.error&&!error">
    <div class="t24 mb2">
      {{ props.parent.codigo }} - {{ props.parent.titulo }}
    </div>

    <Form
      ref="varForm"
      v-slot="{ errors, isSubmitting }"
      :validation-schema="schema"
      :initial-values="SingleRisco"
      @submit="onSubmit"
    >
      <div class="mb2">
        <label class="label">Detalhamento</label>
        <TextEditor v-model="detalhamento" />
      </div>
      <div class="mb2">
        <label class="label">Ponto de atenção</label>
        <TextEditor v-model="ponto_de_atencao" />
      </div>
      <div class="flex spacebetween center mb2">
        <hr class="mr2 f1">
        <button
          ref="submitBt"
          type="submit"
          class="btn big"
          :disabled="isSubmitting"
        >
          Salvar análise de risco
        </button>
        <hr class="ml2 f1">
      </div>
    </Form>
  </template>
  <template v-if="SingleRisco?.loading">
    <span class="spinner">Carregando</span>
  </template>
  <template v-if="SingleRisco?.error||error">
    <div class="error p1">
      <div class="error-msg">
        {{ SingleRisco.error??error }}
      </div>
    </div>
  </template>
</template>
