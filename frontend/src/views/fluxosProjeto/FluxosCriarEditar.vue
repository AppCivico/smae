<script setup>
import { workflow as schema } from '@/consts/formSchemas';
import { ErrorMessage, Field, Form, useForm,} from 'vee-validate';
import { storeToRefs } from 'pinia';
import { useAlertStore } from '@/stores/alert.store';
import { useRouter } from "vue-router";
import { computed, ref, watch } from 'vue';
import { useTipoDeTransferenciaStore } from '@/stores/tipoDeTransferencia.store';
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';

const router = useRouter();
const alertStore = useAlertStore();
const tipoDeTransferenciaStore = useTipoDeTransferenciaStore();
const fluxosProjetoStore = useFluxosProjetosStore();
const { lista: tipoTransferenciaComoLista } = storeToRefs(tipoDeTransferenciaStore);
const { chamadasPendentes, erro, itemParaEdição, emFoco} = storeToRefs(fluxosProjetoStore);

const props = defineProps({
  fluxoId: {
    type: Number,
    default: 0,
  },
});
const esferaSelecionada = ref('');
const { errors, isSubmitting, setFieldValue, values } = useForm({
  initialValues: itemParaEdição,
  validationSchema: schema,
});

const tiposDisponíveis = computed(() => (values.esfera
  ? tipoTransferenciaComoLista.value.filter((x) => x.esfera === values.esfera)
  : []));

async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.fluxoId
      ? "Dados salvos com sucesso!"
      : "Item adicionado com sucesso!";

    const resposta =  await fluxosProjetoStore.salvarItem(carga, props.fluxoId)
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

async function iniciar() {
  tipoDeTransferenciaStore.buscarTudo();
  if(props.fluxoId){
    await fluxosProjetoStore.buscarItem(props.fluxoId);
  }
}
iniciar()

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>Cadastro de Fluxo</h1>
    <hr class="ml2 f1">
  </div>

  <form @submit="onSubmit">
    <div class="flex g2 mb1 center">
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
      <div class="f1">
        <LabelFromYup
          name="esfera"
          :schema="schema"
        />
        <Field
          v-model="esferaSelecionada"
          name="esfera"
          as="select"
          class="inputtext light mb1"
          :class="{ 'error': errors.esfera }"
          @change="setFieldValue('transferencia_tipo_id', null)"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in Object.values(esferasDeTransferencia)"
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
          :disabled="!tiposDisponíveis.length"
        >
          <option value="">
            Selecionar
          </option>
          <option
            v-for="item in tiposDisponíveis"
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
    </div>

    <div class="flex g2 mb1 center">
      <div class="f1">
        <LabelFromYup
          name="inicio"
          :schema="schema"
        />
        <Field
          name="inicio"
          type="date"
          class="inputtext light mb1"
          :class="{ errors: errors.inicio }"
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
          :class="{ errors: errors.termino }"
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
      <FormErrorsList :errors="errors" />
    </div>
    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="Object.keys(errors)?.length
          ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
          : null"
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </form>

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
  <template v-if="props.fluxoId">
    <div class="flex spacebetween center mb2">
      <h1>Etapas do fluxo</h1>
      <hr class="ml2 f1">
      <router-link
        :to="{ name: 'etapaFluxoCriarEditar' }"
        class="btn big ml2"
      >
        Adicionar etapa
      </router-link>
    </div>
  </template>
</template>
