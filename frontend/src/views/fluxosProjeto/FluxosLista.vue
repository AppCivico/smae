<script setup>
import { workflow as schema } from '@/consts/formSchemas';
import { ErrorMessage, Field, Form, useIsFormDirty} from 'vee-validate';
import { storeToRefs } from 'pinia';
import { useAlertStore } from '@/stores/alert.store';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';

const props = defineProps({
  fluxosId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();
const TipoDeTransferenciaStore = useTipoDeTransferenciaStore();
const { tipoTransferenciaComoLista } = storeToRefs(TipoDeTransferenciaStore);

function iniciar(){
  TipoDeTransferenciaStore.buscarTudo();
}
iniciar()

async function onSubmit(_, { controlledValues: carga }) {
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
  </div>

  <Form @submit.prevent="onSubmit"
    v-slot="{ errors, isSubmitting, values }"
    :validation-schema="schema"
    :initial-values="itemParaEdição"
  >
    <div class="flex g2 mb1 center">
      <div class="f1">
        <LabelFromYup
          name="transferencia_tipo_id"
          :schema="schema"
        />
        <Field
          name="transferencia_tipo_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.transferencia_tipo_id,
            loading: TipoDeTransferenciaStore.chamadasPendentes?.lista,
          }"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in tipoTransferenciaComoLista"
            :key="item"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="transferencia_tipo_id"
          class="error-msg"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="inicio"
          :schema="schema"
        />
        <Field
          name="inicio"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.inicio }"
          maxlength="10"
        />
        <ErrorMessage
          name="inicio"
          class="error-msg"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="termino"
          :schema="schema"
        />
        <Field
          name="termino"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.termino }"
          maxlength="10"
        />
        <ErrorMessage
          name="termino"
          class="error-msg"
        />
      </div>
      <div class="f1 flex">
        <Field
          name="ativo"
          type="checkbox"
          :value="true"
          class="inputcheckbox mr1"
        />
        <LabelFromYup
          name="ativo"
          :schema="schema"
        />
        <ErrorMessage
          class="error-msg"
          name="ativo"
        />
      </div>
    </div>
    <div class="flex g2 mb1 center">
      <div>
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
      <FormErrorsList :errors="errors" />
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
      >
        Salvar
      </button>
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
