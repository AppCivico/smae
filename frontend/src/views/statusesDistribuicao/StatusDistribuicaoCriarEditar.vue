<template>
  <div class="flex spacebetween center mb2">
    <h1> <span v-if="!statusDistribuicaoId" /> {{ titulo || "Status de Distribuição" }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>
  <Form
    v-slot="{ errors, isSubmitting }"
    :validation-schema="schema"
    :initial-values="itemParaEdicao"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="nome"
          :schema="schema"
        />
        <Field
          name="nome"
          type="text"
          class="inputtext light mb1"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="nome"
        />
      </div>
    </div>
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup
          name="tipo"
          :schema="schema"
        />
        <Field
          v-model="tipoSelecionado"
          name="tipo"
          as="select"
          class="inputtext light mb1"
          :class="{ error: errors.tipo }"
          @change="setFieldValue('tipo_id', null)"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in Object.values(tiposStatusDistribuicao)"
            :key="item.valor"
            :value="item.valor"
          >
            {{ item.nome }}
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.esfera }}
        </div>
      </div>
    </div>
    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="
          Object.keys(errors)?.length
            ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
            : null
        "
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>

<script setup>
import { statusDistribuicaoWorkflow as schema } from '@/consts/formSchemas';
import tiposStatusDistribuicao from '@/consts/tiposStatusDistribuicao';
import { useAlertStore } from '@/stores/alert.store';
import { useStatusDistribuicaoWorflowStore } from '@/stores/statusDistribuicaoWorkflow.store';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';
import { storeToRefs } from 'pinia';
import {
  ErrorMessage, Field, Form, useForm,
} from 'vee-validate';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const props = defineProps({
  statusDistribuicaoId: {
    type: Number,
    default: 0,
  },
});

const titulo = typeof route?.meta?.título === 'function'
  ? computed(() => route.meta.título())
  : route?.meta?.título;

const alertStore = useAlertStore();
const statusDistribuicaoWorflowStore = useStatusDistribuicaoWorflowStore();
const TipoDeTransferenciaStore = useTipoDeTransferenciaStore();
const { chamadasPendentes, erro, itemParaEdicao } = storeToRefs(statusDistribuicaoWorflowStore);

const { lista: tipoTransferenciaComoLista } = storeToRefs(TipoDeTransferenciaStore);
const tiposDisponíveis = computed(() => (tipoTransferenciaComoLista.value));
const tipoSelecionado = ref('');

const {
  errors, handleSubmit, isSubmitting, resetForm, setFieldValue, values,
} = useForm({
  initialValues: itemParaEdicao,
  validationSchema: schema,
});

function iniciar() {
  TipoDeTransferenciaStore.buscarTudo();
}

iniciar();

// TODO: refatorar
async function onSubmit(values) {
  try {
    let response;
    const msg = props.statusDistribuicaoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const dataToSend = { ...values };

    if (route.params?.statusDistribuicaoId) {
      response = await statusDistribuicaoWorflowStore.salvarItem(
        dataToSend,
        route.params?.statusDistribuicaoId,
      );
    } else {
      response = await statusDistribuicaoWorflowStore.salvarItem(dataToSend);
    }
    if (response) {
      alertStore.success(msg);
      statusDistribuicaoWorflowStore.$reset();
      router.push({ name: 'statusDistribuicaoListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

statusDistribuicaoWorflowStore.$reset();
// não foi usada a prop.statusDistribuicaoId pois estava vazando do edit na hora de criar uma nova
if (route.params?.statusDistribuicaoId) {
  statusDistribuicaoWorflowStore.buscarItem(route.params?.statusDistribuicaoId);
}
</script>

  <style></style>
