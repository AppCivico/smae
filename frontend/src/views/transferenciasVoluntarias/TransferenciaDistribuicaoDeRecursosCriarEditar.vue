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
    <h1>Formulário de registro</h1>
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

    <div class=" g2 mb2">
      <div class="halfInput">
        <LabelFromYup name="valor" :schema="schema" />
        <Field name="valor" type="text" class="inputtext light mb2" placeholder="R$ 000.000.000.000,00"/>
        <ErrorMessage class="error-msg mb2" name="valor" />
      </div>
      <div class="halfInput">
        <LabelFromYup name="valor_contrapartida" :schema="schema" />
        <Field name="valor_contrapartida" type="text" class="inputtext light mb2" placeholder="R$ 000.000.000.000,00"/>
        <ErrorMessage class="error-msg mb2" name="valor_contrapartida" />
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
      <div class="f1 mb1">
        <LabelFromYup name="programa_orcamentario_municipal" :schema="schema" />
        <Field name="programa_orcamentario_municipal" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="programa_orcamentario_municipal" />
      </div>
      <div class="f1 mb1">
        <LabelFromYup name="programa_orcamentario_estadual" :schema="schema" />
        <Field name="programa_orcamentario_estadual" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="programa_orcamentario_estadual" />
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

    <div class="flex g2">
      <div class="f1 mb1">
        <LabelFromYup name="numero_proposta" :schema="schema" />
        <Field name="numero_proposta" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="numero_proposta" />
      </div>
      <div class="f1 mb1">
        <LabelFromYup name="numero_convenio" :schema="schema" />
        <Field name="numero_convenio" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="numero_convenio" />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1">
        <LabelFromYup name="numero_contrato" :schema="schema" />
        <Field name="numero_contrato" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="numero_contrato" />
      </div>
      <div class="f1">
        <LabelFromYup
          name="data_assinatura_termo_aceite"
          :schema="schema"
        />
        <Field
          name="data_assinatura_termo_aceite"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.data_assinatura_termo_aceite }"
          maxlength="10"
          @update:model-value="values.data_assinatura_termo_aceite === ''
            ? values.data_assinatura_termo_aceite = null
            : null"
        />
        <ErrorMessage
          name="data_assinatura_termo_aceite"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2">
      <div class="f1">
        <LabelFromYup
          name="data_assinatura_representante_municipio"
          :schema="schema"
        />
        <Field
          name="data_assinatura_representante_municipio"
          type="date"
          class="inputtext light"
          :class="{ 'error': errors.data_assinatura_representante_municipio }"
          maxlength="10"
          @update:model-value="values.data_assinatura_representante_municipio === ''
            ? values.data_assinatura_representante_municipio = null
            : null"
        />
        <ErrorMessage
          name="data_assinatura_representante_municipio"
          class="error-msg"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="assinatura_representante_estado"
          :schema="schema"
        />
        <Field
          name="assinatura_representante_estado"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.assinatura_representante_estado }"
          maxlength="10"
          @update:model-value="values.assinatura_representante_estado === ''
            ? values.assinatura_representante_estado = null
            : null"
        />
        <ErrorMessage
          name="assinatura_representante_estado"
          class="error-msg"
        />
      </div>
    </div>

    <div class="flex g2 mb3">
      <div class="f1">
        <LabelFromYup
          name="data_vigencia"
          :schema="schema"
        />
        <Field
          name="data_vigencia"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.data_vigencia }"
          maxlength="10"
          @update:model-value="values.data_vigencia === ''
            ? values.data_vigencia = null
            : null"
        />
        <ErrorMessage
          name="data_vigencia"
          class="error-msg"
        />
      </div>
      <div class="f1">
        <LabelFromYup
          name="clausula_suspensiva_conclusao"
          :schema="schema"
        />
        <Field
          name="clausula_suspensiva_conclusao"
          type="date"
          class="inputtext light mb1"
          :class="{ 'error': errors.clausula_suspensiva_conclusao }"
          maxlength="10"
          @update:model-value="values.clausula_suspensiva_conclusao === ''
            ? values.clausula_suspensiva_conclusao = null
            : null"
        />
        <ErrorMessage
          name="clausula_suspensiva_conclusao"
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

