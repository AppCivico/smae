<script setup>
import { transferenciasVoluntarias as schema } from '@/consts/formSchemas';
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
  </div>

  <div class="flex spacebetween center mb1">
    <h3 class="title">Distribuição de Recursos</h3>
    <hr class="ml2 f1">
  </div>

  <Form v-slot="{ errors, isSubmitting }" :validation-schema="schema" :initial-values="itemParaEdição"
    @submit="onSubmit">
    <div class="flex spacebetween center mb1">
      <h3 class="title">Registro Distribuição de Recursos</h3>
      <hr class="ml2 f1">
    </div>
    <div class="f1">
        <LabelFromYup name="teste.ano" :schema="schema" />
        <Field name="teste.ano" type="text" class="inputtext light mb1" />
        <ErrorMessage class="error-msg mb1" name="teste.ano" />
      </div>
    <!-- <div class="flex g2 mb1">
      <div class="f1 mb1">
        <LabelFromYup name="parlamentar_id" :schema="schema" />
        <Field
          name="parlamentar_id"
          as="select"
          class="inputtext light mb1"
          :class="{
            error: errors.parlamentar_id,
            loading: ParlamentaresStore.chamadasPendentes?.lista,
          }"
        >
          <option :value="0">
            Selecionar
          </option>

          <option
            v-for="item in parlamentarComoLista"
            :key="item"
            :value="item.id"
          >
            {{ item.nome }}
          </option>
        </Field>
        <ErrorMessage
          name="parlamentar_id"
          class="error-msg"
        />
      </div>
    </div> -->

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

