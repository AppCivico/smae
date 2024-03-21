<script setup>
import { registroDeTransferencia as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form} from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const transferenciasVoluntarias = useTransferenciasVoluntariasStore();
const { chamadasPendentes, erro, lista} = storeToRefs(transferenciasVoluntarias);


const router = useRouter();
const route = useRoute();
const props = defineProps({
  transferenciaId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();

async function onSubmit(_, { controlledValues }) {
  try {
    let r;
    const msg = props.transferenciaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.transferenciaId) {
      r = await transferenciasVoluntarias.salvarItem(controlledValues, props.transferenciaId);
    } else {
      r = await transferenciasVoluntarias.salvarItem(controlledValues);
    }
    if (r) {
      alertStore.success(msg);
      transferenciasVoluntarias.$reset();
      router.push({ name: 'TransferenciaDistribuicaoDeRecursosCriar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

if (props.transferenciaId) {
  transferenciasVoluntarias.buscarItem(props.transferenciaId);
}
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Formulário de registro' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <div class="flex spacebetween center mb1">
    <h3 class="title">Recurso Financeiro</h3>
    <hr class="ml2 f1">
  </div>

  <Form v-slot="{ errors, isSubmitting }" :validation-schema="schema" :initial-values="itemParaEdição"
    @submit="onSubmit">
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="valor" :schema="schema" />
        <Field name="valor" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="valor" />
      </div>
      <div class="f1">
        <label class="label">Empenho <span class="tvermelho">*</span></label>
        <Field name="empenho" as="select" class="inputtext light mb1" :class="{ 'error': errors.empenho }">
          <option value="">
            Selecionar
          </option>
          <option :value="true">
            Sim
          </option>
          <option :value="false ">
            Não
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.empenho }}
        </div>
      </div>
    </div>
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="valor_contrapartida" :schema="schema" />
        <Field name="valor_contrapartida" type="text" class="inputtext light mb1" placeholder="R$ 000.000.000.000,00"/>
        <ErrorMessage class="error-msg mb1" name="valor_contrapartida" />
      </div>
      <div class="f1">
        <LabelFromYup name="dotacao" :schema="schema" />
        <Field name="dotacao" type="text" class="inputtext light mb1" placeholder="16.24.12.306.3016.2.873.33903900.00"/>
        <ErrorMessage class="error-msg mb1" name="dotacao" />
      </div>
    </div>
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="valor_total" :schema="schema" />
        <Field name="valor_total" type="text" class="inputtext light mb1" placeholder="R$ 000.000.000.000,00"/>
        <ErrorMessage class="error-msg mb1" name="valor_total" />
      </div>
      <div class="f1">
        <LabelFromYup name="ordenador_despesa" :schema="schema" />
        <Field name="ordenador_despesa" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="ordenador_despesa" />
      </div>
    </div>

    <div class="flex spacebetween center mb1">
      <h3 class="title">Dados Bancários de Aceite</h3>
      <hr class="ml2 f1">
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="banco_aceite" :schema="schema" />
        <Field name="banco_aceite" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="banco_aceite" />
      </div>
      <div class="f1">
        <LabelFromYup name="agencia_aceite" :schema="schema" />
        <Field name="agencia_aceite" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="agencia_aceite" />
      </div>
    </div>
    <div class="f1 mb2">
      <LabelFromYup name="conta_aceite" :schema="schema" />
      <Field name="conta_aceite" type="text" class="inputtext light mb1" />
      <ErrorMessage class="error-msg mb1" name="conta_aceite" />
    </div>

    <div class="flex spacebetween center mb1">
      <h3 class="title">Dados Bancários Secretaria Fim</h3>
      <hr class="ml2 f1">
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="banco_fim" :schema="schema" />
        <Field name="banco_fim" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="banco_fim" />
      </div>
      <div class="f1">
        <LabelFromYup name="agencia_fim" :schema="schema" />
        <Field name="agencia_fim" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="agencia_fim" />
      </div>
    </div>
    <div  class="g2 mb1">
      <div class="f1 mb2">
        <LabelFromYup name="conta_fim" :schema="schema" />
        <Field name="conta_fim" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="conta_fim" />
      </div>
      <div class="f1 mb2">
        <LabelFromYup name="conta_fim" :schema="schema" />
        <Field name="conta_fim" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="conta_fim" />
      </div>
      <div class="f1 mb2">
        <LabelFromYup name="gestor_contrato" :schema="schema" />
        <Field name="gestor_contrato" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="gestor_contrato" />
      </div>
    </div>



    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button class="btn big" :disabled="isSubmitting || Object.keys(errors)?.length" :title="Object.keys(errors)?.length
      ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
      : null">
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>

  <span v-if="chamadasPendentes?.emFoco" class="spinner">Carregando</span>

  <div v-if="erro" class="error p1">
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>

