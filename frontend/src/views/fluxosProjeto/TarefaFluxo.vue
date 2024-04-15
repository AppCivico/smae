<script setup>
import SmallModal from '@/components/SmallModal.vue';
import { tarefaFluxo as schema } from '@/consts/formSchemas';
import responsabilidadeEtapaFluxo from '@/consts/responsabilidadeEtapaFluxo.js';
import { useAlertStore } from '@/stores/alert.store';
import { useFluxosTarefasProjetosStore } from '@/stores/fluxosTarefaProjeto.store';
import { useTarefasProjetosStore } from '@/stores/tarefasProjeto.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, useForm } from 'vee-validate';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const fluxoTarefasProjetosStore = useFluxosTarefasProjetosStore();
const tarefasProjetosStore = useTarefasProjetosStore();
const { lista } = storeToRefs(tarefasProjetosStore);
const { lista: listaDeTarefasNoFluxo } = storeToRefs(fluxoTarefasProjetosStore);
const alertStore = useAlertStore();
const router = useRouter();
const erro = ref(null);
const exibeModal = ref(false);

const emits = defineEmits(['close', 'saved']);
const props = defineProps({
  faseId: {
    type: Number,
    required: true,
  },
  relacionamentoId: {
    type: Number,
    default: 0,
  },
});

const itemParaEdição = computed(() => {
  const tarefa = listaDeTarefasNoFluxo.value.find((x) => (x.id === Number(props.relacionamentoId)));

  return tarefa
    ? {
      ...tarefa,
      workflow_tarefa_id: tarefa?.workflow_tarefa?.id || null,
    }
    : {
      responsabilidade: '',
      workflow_tarefa_id: 0,
      ordem: 0,
    };
});

const {
  errors, isSubmitting, values, handleSubmit, resetForm, setFieldValue,
} = useForm({
  validationSchema: schema,
  initialValues: itemParaEdição.value,
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
  tarefasProjetosStore.buscarTudo();
  if (props.relacionamentoId) {
    fluxoTarefasProjetosStore.buscarTudo();
  }
}
iniciar();

watch(itemParaEdição, (novoValor) => {
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

    <pre v-scrollLockDebug>values:{{ values }}</pre>

    <form
      :disabled="isSubmitting"
      @submit.prevent="onSubmit"
    >
      <Field
        name="fluxo_fase_id"
        type="hidden"
        class="inputtext light mb1"
        :value="props.faseId"
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
      <div>
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
