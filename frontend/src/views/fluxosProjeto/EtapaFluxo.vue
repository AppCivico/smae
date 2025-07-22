<!-- não finalizado -->
<script setup>
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { computed, ref, watch } from 'vue';
import SmallModal from '@/components/SmallModal.vue';
import { fasesFluxo as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';
import { useFluxosEtapasProjetosStore } from '@/stores/fluxosEtapasProjeto.store';
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';

const props = defineProps({
  etapaId: {
    type: Number,
    default: 0,
  },
  fluxoId: {
    type: Number,
    default: 0,
  },
  ordem: {
    type: Number,
    required: true,
  },
  workflow_etapa_de_id: {
    type: Number,
    required: true,
  },
  workflow_etapa_para_id: {
    type: Number,
    required: true,
  },
});

const emits = defineEmits(['close', 'saved']);

const etapasProjetosStore = useEtapasProjetosStore();
const fluxosEtapasProjetos = useFluxosEtapasProjetosStore();
const fluxosProjetoStore = useFluxosProjetosStore();

const { lista, erro: erroNaListaDeEtapas } = storeToRefs(etapasProjetosStore);
const { emFoco } = storeToRefs(fluxosProjetoStore);
const alertStore = useAlertStore();
const erro = ref(null);

const proximaOrdemDisponivel = computed(() => {
  if (!emFoco.value?.fluxo || emFoco.value.fluxo.length === 0) {
    return 1;
  }
  const ultimaOrdem = emFoco.value.fluxo
    .reduce((acc, etapa) => (
      etapa.ordem > acc ? etapa.ordem : acc
    ), 0);
  return ultimaOrdem + 1;
});

const itemParaEdicao = computed(() => {
  const etapaDoFluxo = emFoco.value?.fluxo?.find((x) => (x.id === Number(props.etapaId)));
  return {
    ...etapaDoFluxo,
    ordem: etapaDoFluxo?.ordem || proximaOrdemDisponivel.value,
    workflow_etapa_de_id: etapaDoFluxo?.workflow_etapa_de?.id || null,
    workflow_etapa_para_id: etapaDoFluxo?.workflow_etapa_para?.id || null,
  };
});

const {
  errors, isSubmitting, resetForm, handleSubmit, values,
} = useForm({
  validationSchema: schema,
  initialValues: itemParaEdicao,
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    const msg = props.etapaId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';
    const resposta = await fluxosEtapasProjetos.salvarItem(valoresControlados, props.etapaId);
    if (resposta) {
      alertStore.success(msg);
      fluxosEtapasProjetos.$reset();
      emits('saved');
      emits('close');
    }
  } catch (error) {
    alertStore.error(error);
  }
});

function iniciar() {
  etapasProjetosStore.buscarTudo();

  if (props.etapaId) {
    fluxosEtapasProjetos.buscarTudo();
  }
}

iniciar();

const listaOrdenada = computed(() => lista.value
  .toSorted((a, b) => a.descricao.localeCompare(b.descricao)));

watch(itemParaEdicao, (novoValor) => {
  resetForm({
    initialValues: novoValor,
  });
});
</script>
<template>
  <SmallModal
    @close="$emit('close')"
  >
    <div class="flex spacebetween center mb2">
      <h2>
        <template v-if="etapaId">
          Editar
        </template>
        <template v-else>
          Adicionar
        </template>
        etapa
      </h2>
      <hr class="ml2 f1">
      <CheckClose
        :apenas-emitir="true"
        @close="$emit('close')"
      />
    </div>

    <pre v-scrollLockDebug>emFoco.fluxo: {{ emFoco.fluxo }}</pre>
    <pre v-scrollLockDebug>itemParaEdicao: {{ itemParaEdicao }}</pre>

    <ErrorComponent
      v-if="erroNaListaDeEtapas"
      class="mb1"
    >
      {{ erroNaListaDeEtapas }}
    </ErrorComponent>
    <form
      :disabled="isSubmitting"
      @submit.prevent="onSubmit"
    >
      <div>
        <Field
          name="workflow_id"
          type="hidden"
          class="inputtext light mb1"
          :value="emFoco.id"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="nome"
        />
      </div>
      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="workflow_etapa_de_id"
            :schema="schema"
          />
          <Field
            name="workflow_etapa_de_id"
            as="select"
            class="inputtext light mb1"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in listaOrdenada"
              :key="item"
              :value="item.id"
            >
              {{ item.descricao }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="workflow_etapa_de_id"
          />
        </div>
        <div class="f1">
          <LabelFromYup
            name="workflow_etapa_para_id"
            :schema="schema"
          />
          <Field
            name="workflow_etapa_para_id"
            as="select"
            class="inputtext light mb1"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in listaOrdenada"
              :key="item"
              :value="item.id"
            >
              {{ item.descricao }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="workflow_etapa_para_id"
          />
        </div>
      </div>
      <div>
        <div class="mb1">
          <LabelFromYup
            name="ordem"
            :schema="schema"
          />
          <Field
            name="ordem"
            type="number"
            class="inputtext light mb1"
            min="1"
            max="10"
            step="1"
            @update:model-value="values.ordem = Number(values.ordem)"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="ordem"
          />
        </div>
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

    <div
      v-if="erro"
      class="error p1"
    >
      <div class="error-msg">
        {{ erro }}
      </div>
    </div>
  </SmallModal>
</template>
