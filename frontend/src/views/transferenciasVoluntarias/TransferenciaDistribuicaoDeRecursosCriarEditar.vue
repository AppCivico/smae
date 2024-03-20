<script setup>
import { transferenciaDistribuicaoDeRecursos as schema } from '@/consts/formSchemas';
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
  tipoId: {
    type: Number,
    default: 0,
  },
});

const alertStore = useAlertStore();

async function onSubmit(values) {
  try {
    let r;
    const msg = props.tipoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    if (props.tipoId) {
      r = await transferenciasVoluntarias.salvarItem(values, props.tipoId);
    } else {
      r = await transferenciasVoluntarias.salvarItem(values);
    }
    if (r) {
      alertStore.success(msg);
      transferenciasVoluntarias.$reset();
      router.push({ name: 'tipoDeTrasferenciaListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

function iniciar(){
  if (props.tipoId) {
    transferenciasVoluntarias.buscarTudo(props.tipoId);
  }
}
console.log(schema)
iniciar()

</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Formulário de registro' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <div class="flex spacebetween center mb1">
    <h3 class="title">Distribuição de Recursos</h3>
    <hr class="ml2 f1">
  </div>

  <Form v-slot="{ errors, isSubmitting }"
    :validation-schema="schema"
    :initial-values="itemParaEdição"
    @submit="onSubmit">

    <div class="flex spacebetween center mb1">
      <h3 class="title">Registro Distribuição de Recursos</h3>
      <hr class="ml2 f1">
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="gestor_contrato" :schema="schema" />
        <Field name="gestor_contrato" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="gestor_contrato" />
      </div>
    </div>

    <div  class="flex g2 mb1">
      <div  class="f1">
        <LabelFromYup name="objeto" :schema="schema" />
        <Field name="objeto" as="textarea" class="inputtext light mb1" rows="5"/>
        <ErrorMessage class="error-msg mb1" name="objeto" />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="halfInput ">
        <LabelFromYup name="valor" :schema="schema" />
        <Field name="valor" type="text" class="inputtext light mb1" placeholder="R$ 000.000.000.000,00"/>
        <ErrorMessage class="error-msg mb1" name="valor" />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="halfInput">
        <LabelFromYup name="valor_contrapartida" :schema="schema" />
        <Field name="valor_contrapartida" type="text" class="inputtext light mb1" placeholder="R$ 000.000.000.000,00"/>
        <ErrorMessage class="error-msg mb1" name="valor_contrapartida" />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="valor_total" :schema="schema" />
        <Field name="valor_total" type="text" class="inputtext light mb1" placeholder="R$ 000.000.000.000,00"/>
        <ErrorMessage class="error-msg mb1" name="valor_total" />
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

    <div class="mb1">
      <div class="f1 mb2">
        <LabelFromYup name="gestor_contrato" :schema="schema" />
        <Field name="gestor_contrato" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="gestor_contrato" />
      </div>
      <div class="f1 mb2">
        <LabelFromYup name="gestor_contrato" :schema="schema" />
        <Field name="gestor_contrato" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="gestor_contrato" />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="dotacao" :schema="schema" />
        <Field name="dotacao" type="text" class="inputtext light mb1" placeholder="16.24.12.306.3016.2.873.33903900.00"/>
        <ErrorMessage class="error-msg mb1" name="dotacao" />
      </div>
      <!-- falta campo -->
    </div>

    <div class="flex g2 mb1">
      <div class="f1 mb2">
        <LabelFromYup name="gestor_contrato" :schema="schema" />
        <Field name="gestor_contrato" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="gestor_contrato" />
      </div>
      <div class="f1 mb2">
        <LabelFromYup name="gestor_contrato" :schema="schema" />
        <Field name="gestor_contrato" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="gestor_contrato" />
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="gestor_contrato" :schema="schema" />
        <Field name="gestor_contrato" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="gestor_contrato" />
      </div>
      <div class="f1">
        <LabelFromYup
          name="clausula_suspensiva_vencimento"
          :schema="schema"
        />
        <Field
          name="clausula_suspensiva_vencimento"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.clausula_suspensiva_vencimento }"
          maxlength="10"
          @update:model-value="values.clausula_suspensiva_vencimento === ''
            ? values.clausula_suspensiva_vencimento = null
            : null"
        />
        <ErrorMessage
          name="clausula_suspensiva_vencimento"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1">
        <LabelFromYup
          name="clausula_suspensiva_vencimento"
          :schema="schema"
        />
        <Field
          name="clausula_suspensiva_vencimento"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.clausula_suspensiva_vencimento }"
          maxlength="10"
          @update:model-value="values.clausula_suspensiva_vencimento === ''
            ? values.clausula_suspensiva_vencimento = null
            : null"
        />
        <ErrorMessage
          name="clausula_suspensiva_vencimento"
          class="error-msg"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="clausula_suspensiva_vencimento"
          :schema="schema"
        />
        <Field
          name="clausula_suspensiva_vencimento"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.clausula_suspensiva_vencimento }"
          maxlength="10"
          @update:model-value="values.clausula_suspensiva_vencimento === ''
            ? values.clausula_suspensiva_vencimento = null
            : null"
        />
        <ErrorMessage
          name="clausula_suspensiva_vencimento"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1">
        <LabelFromYup
          name="clausula_suspensiva_vencimento"
          :schema="schema"
        />
        <Field
          name="clausula_suspensiva_vencimento"
          type="date"
          class="inputtext light"
          :class="{ 'error': errors.clausula_suspensiva_vencimento }"
          maxlength="10"
          @update:model-value="values.clausula_suspensiva_vencimento === ''
            ? values.clausula_suspensiva_vencimento = null
            : null"
        />
        <ErrorMessage
          name="clausula_suspensiva_vencimento"
          class="error-msg"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="clausula_suspensiva_vencimento"
          :schema="schema"
        />
        <Field
          name="clausula_suspensiva_vencimento"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.clausula_suspensiva_vencimento }"
          maxlength="10"
          @update:model-value="values.clausula_suspensiva_vencimento === ''
            ? values.clausula_suspensiva_vencimento = null
            : null"
        />
        <ErrorMessage
          name="clausula_suspensiva_vencimento"
          class="error-msg"
        />
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

