<script setup>
import { transferenciasVoluntarias as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useTransferenciasVoluntariasStore } from '@/stores/tranferenciasVoluntarias.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { useRoute, useRouter } from 'vue-router';

const transferenciasVoluntarias = useTransferenciasVoluntariasStore();
const {
  chamadasPendentes,
  erro,
  lista,
   } = storeToRefs(transferenciasVoluntarias);

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

if (props.tipoId) {
  transferenciasVoluntarias.buscarTudo(props.tipoId);
}

</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Formulário de registro' }}</h1>
  </div>

  <div class="flex spacebetween center mb1">
    <h3 class="title">Identificação</h3>
    <hr class="ml2 f1">
  </div>

  <Form v-slot="{ errors, isSubmitting }" :validation-schema="schema" :initial-values="itemParaEdição"
    @submit="onSubmit">
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="identificador" :schema="schema" />
        <Field name="identificador" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="identificador" />
      </div>

      <div class="f1">
        <label class="label">Esfera <span class="tvermelho">*</span></label>
        <Field name="esfera" as="select" class="inputtext light mb1" :class="{ 'error': errors.esfera }">
          <option value="">
            Selecionar
          </option>
          <option value="Federal">
            Federal
          </option>
          <option value="Estadual ">
            Estadual
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.esfera }}
        </div>
      </div>
    </div>
    <div class="flex g2 mb1">
      <div class="f1">
        <label class="label">Tipo <span class="tvermelho">*</span></label>
        <Field name="categoria" as="select" class="inputtext light mb1" :class="{ 'error': errors.categoria }">
          <option value="">
            Selecionar
          </option>
          <option value="Discricionaria">
            Discricionárias dos Ministérios/Secretarias
          </option>
          <option value="Impositiva">
            Impositivas
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.categoria }}
        </div>
      </div>
      <div class="f1">
        <label class="label">Tipo <span class="tvermelho">*</span></label>
        <Field name="categoria" as="select" class="inputtext light mb1" :class="{ 'error': errors.categoria }">
          <option value="">
            Selecionar
          </option>
          <option value="Discricionaria">
            Discricionárias dos Ministérios/Secretarias
          </option>
          <option value="Impositiva">
            Impositivas
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.categoria }}
        </div>
      </div>
      <div class="f1">
        <LabelFromYup name="programa" :schema="schema" />
        <Field name="programa" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="programa" />
      </div>
    </div>
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="emenda" :schema="schema" />
        <Field name="emenda" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="emenda" />
      </div>

      <div class="f1">
        <LabelFromYup name="emenda_unitaria" :schema="schema" />
        <Field name="emenda_unitaria" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="emenda_unitaria" />
      </div>
    </div>
    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="numero_identificacao" :schema="schema" />
        <Field name="numero_identificacao" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="numero_identificacao" />
      </div>
    </div>

    <div class="flex spacebetween center">
      <h3 class="title">Origem</h3>
      <hr class="ml2 f1">
    </div>

    <div class="flex spacebetween center">
      <h3 class="title">Transferência</h3>
      <hr class="ml2 f1">
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <LabelFromYup name="ano" :schema="schema" />
        <Field name="ano" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="ano" />
      </div>

      <div class="f1">
        <LabelFromYup name="nome_programa" :schema="schema" />
        <Field name="nome_programa" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="nome_programa" />
      </div>
    </div>

    <div class="f1">
      <LabelFromYup name="objeto" :schema="schema" />
      <Field name="objeto" as="textarea" class="inputtext light mb1" />
      <ErrorMessage class="error-msg mb1" name="objeto" />
    </div>

    <div class="f1">
      <LabelFromYup name="detalhamento" :schema="schema" />
      <Field name="detalhamento" as="textarea" class="inputtext light mb1" />
      <ErrorMessage class="error-msg mb1" name="detalhamento" />
    </div>

    <div class="f1">
      <label class="label">Tipo <span class="tvermelho">*</span></label>
      <Field name="critico" as="select" class="inputtext light mb1"
      :class="{ 'error': errors.critico }">
        <option value="true">
          Sim
        </option>
        <option value="false">
          Não
        </option>
      </Field>
      <div class="error-msg">
        {{ errors.critico }}
      </div>
    </div>

    <div class="flex g2 mb1">
      <div class="f1">
        <label class="label">Tipo <span class="tvermelho">*</span></label>
        <Field name="clausula_suspensiva" as="select" class="inputtext light mb1"
        :class="{ 'error': errors.clausula_suspensiva }">
          <option value="true">
            Sim
          </option>
          <option value="false">
            Não
          </option>
        </Field>
        <div class="error-msg">
          {{ errors.clausula_suspensiva }}
        </div>
      </div>
      <div class="f1 mb1">
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

    <div class="f1">
      <LabelFromYup name="normativa" :schema="schema" />
      <Field name="normativa" type="text" class="inputtext light mb1" />
      <ErrorMessage class="error-msg mb1" name="normativa" />
    </div>

    <div class="f1">
      <LabelFromYup name="observacoes" :schema="schema" />
      <Field name="observacoes" as="textarea" class="inputtext light mb1" />
      <ErrorMessage class="error-msg mb1" name="observacoes" />
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


<style scoped>
  h1{
    font-size: 64px;
    color: #233B5C;
    }

  .title {
    color: #B8C0CC;
    font-size: 20px;
  }
</style>
