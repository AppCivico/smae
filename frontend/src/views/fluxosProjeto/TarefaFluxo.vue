<script setup>
import  responsabilidadeEtapaFluxo  from '@/consts/responsabilidadeEtapaFluxo.js';
import { useFluxosTarefasProjetosStore } from '@/stores/fluxosTarefaProjeto.store';
import { useTarefasProjetosStore } from '@/stores/tarefasProjeto.store';
import { tarefaFluxo as schema } from '@/consts/formSchemas';
import { ErrorMessage, Field, useForm} from 'vee-validate';
import SmallModal from "@/components/SmallModal.vue";
import { useRouter } from "vue-router";
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const fluxoTarefasProjetosStore = useFluxosTarefasProjetosStore();
const tarefasProjetosStore = useTarefasProjetosStore();
const { lista: listaTarefa } = storeToRefs(tarefasProjetosStore);
const { itemParaEdição } = storeToRefs(fluxoTarefasProjetosStore);
const alertStore = useAlertStore();
const router = useRouter();
const erro = ref(null);
const exibeModal = ref(false);

const { errors, isSubmitting, values, handleSubmit, setFieldValue }
= useForm({
  validationSchema: schema,
  initialValues: itemParaEdição
});

const emits = defineEmits(['close']);
const props = defineProps({
  tarefaFluxoId: {
    type: Number,
    default: 0,
  },
});

const onSubmit = handleSubmit.withControlled(async (valoresControlados) => {
  try {
    const msg = props.tarefaFluxoId
      ? "Dados salvos com sucesso!"
      : "Item adicionado com sucesso!";

    const resposta =  await fluxoTarefasProjetosStore.salvarItem(valoresControlados, props.tarefaFluxoId)
    if (resposta) {
      alertStore.success(msg);
      fluxoTarefasProjetosStore.$reset();
      fluxoTarefasProjetosStore.buscarTudo();
      emits('close');
    }
  } catch (error) {
    alertStore.error(error);
  }
})

const updateWorkflowTarefaId = (event) => {
  const selectedId = event.target.value;
  setFieldValue('workflow_tarefa_id', selectedId);
};

function iniciar() {
  tarefasProjetosStore.buscarTudo()
}
iniciar();
</script>

<template>
  <SmallModal @close="$emit('close')">
    <div class="flex spacebetween center mb2">
      <h2>Adicionar tarefa</h2>
      <hr class="ml2 f1" />
      <CheckClose
        :apenas-emitir="true"
        @close="$emit('close')"
      />
    </div>

    <form
      :disabled="isSubmitting"
      @submit.prevent="onSubmit"
      >
      {{ values }}
      <div>
        <LabelFromYup
          :name="values.workflow_tarefa_id"
          :schema="schema"
        />
        <Field
          name="workflow_tarefa_id"
          type="hidden"
          class="inputtext light mb1"
          :value="values.workflow_tarefa_id"
        />
        <ErrorMessage
          class="error-msg mb1"
          name="nome"
        />
      </div>
      <div class="flex flexwrap g2 mb1">
        <div class="f1">
          <LabelFromYup
            name="fluxo_fase_id"
            :schema="schema"
          />
          <Field
            name="fluxo_fase_id"
            as="select"
            class="inputtext light mb1"
            @change="updateWorkflowTarefaId"
          >
            <option value="">
              Selecionar
            </option>
            <option
              v-for="item in listaTarefa"
              :key="item"
              :value="item.id"
            >
              {{ item.descricao }}
            </option>
          </Field>
          <ErrorMessage
            class="error-msg"
            name="fluxo_fase_id"
          />
        </div>
        <div class="mb1">
          <LabelFromYup
            name="ordem"
            :schema="schema"
          >
          </LabelFromYup>
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
    <div v-if="erro" class="error p1">
      <div class="error-msg">
        {{ erro }}
      </div>
    </div>
  </SmallModal>
</template>
