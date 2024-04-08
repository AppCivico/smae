<script setup>
import { workflow as schema } from '@/consts/formSchemas';
import { ErrorMessage, Field, Form} from 'vee-validate';
import { storeToRefs } from 'pinia';
import { useAlertStore } from '@/stores/alert.store';
import { useRouter } from "vue-router";
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';

const props = defineProps({
  fluxosId: {
    type: Number,
    default: 0,
  },
});

const router = useRouter();
const alertStore = useAlertStore();
const tipoDeTransferenciaStore = useTipoDeTransferenciaStore();
const fluxosProjetoStore = useFluxosProjetosStore();
const { lista: tipoTransferenciaComoLista } = storeToRefs(tipoDeTransferenciaStore);
const { lista, chamadasPendentes, erro} = storeToRefs(fluxosProjetoStore);

function iniciar(){
  tipoDeTransferenciaStore.buscarTudo();
  fluxosProjetoStore.buscarTudo();
}
iniciar()

async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.fluxosId
      ? "Dados salvos com sucesso!"
      : "Item adicionado com sucesso!";

    const resposta =  await fluxosProjetoStore.salvarItem(carga, props.fluxosId)

    if (resposta) {
      alertStore.success(msg);
      fluxosProjetoStore.$reset();
      fluxosProjetoStore.buscarTudo();
      router.push({ name: "fluxosListar" });
    }
  } catch (error) {
    alertStore.error(error);
  }
}

async function excluirEtapa(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await fluxosProjetoStore.excluirItem(id)) {
      fluxosProjetoStore.buscarTudo();
      alertStore.success('Etapa removida.');
    }
  }, 'Remover');
}

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>Cadastro de Fluxo</h1>
    <hr class="ml2 f1">
  </div>

  <Form @submit="onSubmit"
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
            loading: tipoDeTransferenciaStore.chamadasPendentes?.lista,
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
        class="btn"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="
          Object.keys(errors)?.length
            ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
            : null
        "
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
