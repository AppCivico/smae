<script setup>
import SmallModal from '@/components/SmallModal.vue';
import { tarefaFluxo as schema } from '@/consts/formSchemas';
import responsabilidadeEtapaFluxo from '@/consts/responsabilidadeEtapaFluxo';
import { useAlertStore } from '@/stores/alert.store';
import { useFluxosProjetosStore } from '@/stores/fluxosProjeto.store';
import { useFluxosTarefasProjetosStore } from '@/stores/fluxosTarefaProjeto.store';
import { useWorkflowTarefasStore } from '@/stores/workflowTarefas.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { computed, ref, watch } from 'vue';

const fluxosProjetoStore = useFluxosProjetosStore();
const fluxoTarefasProjetosStore = useFluxosTarefasProjetosStore();
const workflowTarefasStore = useWorkflowTarefasStore();

const { emFoco } = storeToRefs(fluxosProjetoStore);
const { listaOrdenada: lista } = storeToRefs(workflowTarefasStore);
const { lista: listaDeTarefasNoFluxo } = storeToRefs(fluxoTarefasProjetosStore);
const alertStore = useAlertStore();
const erro = ref(null);

const emits = defineEmits(['close', 'saved']);
const props = defineProps({
  faseId: {
    type: Number,
    default: 0,
  },
  relacionamentoId: {
    type: Number,
    default: 0,
  },
  etapaId: {
    type: Number,
    default: 0,
  },
});

const proximaOrdemDisponivel = computed(() => {
  if (!emFoco.value?.fluxo || emFoco.value.fluxo.length === 0) {
    return 1;
  }

  let maxOrdem = 0;
  // eslint-disable-next-line max-len
  const fluxoCorrespondente = emFoco.value.fluxo.find((fluxo) => fluxo.fases.some((fase) => fase.id === props.faseId));

  if (fluxoCorrespondente) {
    const faseCorrespondente = fluxoCorrespondente.fases.find((fase) => fase.id === props.faseId);

    if (faseCorrespondente && faseCorrespondente.tarefas && faseCorrespondente.tarefas.length > 0) {
      faseCorrespondente.tarefas.forEach((tarefa) => {
        if (tarefa.ordem > maxOrdem) {
          maxOrdem = tarefa.ordem;
        }
      });
    }
  }
  return maxOrdem + 1;
});

const itemParaEdicao = computed(() => {
  const tarefa = listaDeTarefasNoFluxo.value.find((x) => (x.id === Number(props.relacionamentoId)));

  return tarefa
    ? {
      ...tarefa,
      ordem: tarefa?.ordem || proximaOrdemDisponivel.value,
      workflow_tarefa_id: tarefa?.workflow_tarefa?.id || null,
    }
    : {
      responsabilidade: '',
      workflow_tarefa_id: 0,
      ordem: proximaOrdemDisponivel.value,
    };
});

const {
  errors, isSubmitting, values, handleSubmit, resetForm, setFieldValue,
} = useForm({
  validationSchema: schema,
  initialValues: itemParaEdicao.value,
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    const msg = props.relacionamentoId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = await fluxoTarefasProjetosStore.salvarItem(
      valoresControlados,
      props.relacionamentoId,
    );
    if (resposta) {
      alertStore.success(msg);
      fluxoTarefasProjetosStore.$reset();
      fluxoTarefasProjetosStore.buscarTudo();
      emits('saved');
      emits('close');
    }
  } catch (error) {
    alertStore.error(error);
  }
});

const updateWorkflowTarefaId = (event) => {
  const selectedId = event.target.value;
  setFieldValue('workflow_tarefa_id', selectedId);
};

const listaOrdenada = computed(() => lista.value
  .toSorted((a, b) => a.descricao.localeCompare(b.descricao)));

function iniciar() {
  workflowTarefasStore.buscarTudo();
  if (props.relacionamentoId) {
    fluxoTarefasProjetosStore.buscarTudo();
  }
}
iniciar();

watch(itemParaEdicao, (novoValor) => {
  resetForm({
    values: novoValor,
  });
});
</script>
<template>
  <SmallModal @close="$emit('close')">
    <div class="flex spacebetween center mb2">
      <h2>
        <template v-if="relacionamentoId">
          Editar
        </template>
        <template v-else>
          Adicionar
        </template>
        tarefa
      </h2>
      <hr class="ml2 f1">
      <CheckClose
        :apenas-emitir="true"
        @close="$emit('close')"
      />
    </div>

    <pre v-scrollLockDebug>values:{{ emFoco.fluxo }}</pre>

    <form
      :disabled="isSubmitting"
      @submit.prevent="onSubmit"
    >
      <Field
        name="fluxo_fase_id"
        type="hidden"
        class="inputtext light mb1"
        :value="faseId"
      />

      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="workflow_tarefa_id"
            :schema="schema"
          />
          <Field
            name="workflow_tarefa_id"
            as="select"
            class="inputtext light mb1"
            @change="updateWorkflowTarefaId"
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
            name="workflow_tarefa_id"
          />
        </div>
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
            max="1000"
            step="1"
            @update:model-value="values.ordem = Number(values.ordem)"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="ordem"
          />
        </div>
      </div>
      <div class="flex flexwrap center g2">
        <div class="f1">
          <LabelFromYup
            name="responsabilidade"
            :schema="schema"
          />
          <Field
            name="responsabilidade"
            as="select"
            class="inputtext light mb1"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in Object.values(responsabilidadeEtapaFluxo)"
              :key="item.valor"
              :value="item.valor"
            >
              {{ item.nome }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="responsabilidade"
          />
        </div>
        <div>
          <LabelFromYup
            name="duracao"
            :schema="schema"
          />
          <Field
            name="duracao"
            type="number"
            class="inputtext light mb1"
            min="1"
            max="1000"
            step="1"
            @update:model-value="values.duracao = Number(values.duracao)"
          />
          <ErrorMessage
            class="error-msg mb1"
            name="duracao"
          />
        </div>
        <div class="flex">
          <Field
            name="marco"
            type="checkbox"
            :value="true"
            :unchecked-value="false"
            class="inputcheckbox mr1"
          />
          <LabelFromYup
            name="marco"
            :schema="schema"
          />
          <ErrorMessage
            class="error-msg"
            name="marco"
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
