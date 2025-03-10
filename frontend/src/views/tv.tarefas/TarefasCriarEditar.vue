<script setup>
import { tarefasProjeto as schema } from '@/consts/formSchemas';
import { useAlertStore } from '@/stores/alert.store';
import { useWorkflowTarefasStore } from '@/stores/workflowTarefas.store';
import { storeToRefs } from 'pinia';
import { ErrorMessage, Field, Form } from 'vee-validate';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const alertStore = useAlertStore();
const workflowTarefas = useWorkflowTarefasStore();
const router = useRouter();
const route = useRoute();
const { chamadasPendentes, erro, lista } = storeToRefs(workflowTarefas);

const props = defineProps({
  tarefasId: {
    type: Number,
    default: 0,
  },
});

const itemParaEdicao = computed(() => lista.value
  .find((x) => x.id === Number(route.params.tarefasId)) || {
  id: 0, descricao: '',
});

async function onSubmit(_, { controlledValues: carga }) {
  try {
    const msg = props.tarefasId
      ? 'Dados salvos com sucesso!'
      : 'Item adicionado com sucesso!';

    const resposta = await workflowTarefas.salvarItem(carga, props.tarefasId);

    if (resposta) {
      alertStore.success(msg);
      workflowTarefas.$reset();
      workflowTarefas.buscarTudo();
      router.push({ name: 'workflow.TarefasListar' });
    }
  } catch (error) {
    alertStore.error(error);
  }
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Nova tarefa' }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <Form
    v-slot="{ errors, isSubmitting }"
    :initial-values="itemParaEdicao"
    :disabled="chamadasPendentes.emFoco"
    :validation-schema="schema"
    @submit="onSubmit"
  >
    <div class="flex g2 mb1">
      <div class="f2 mb1">
        <LabelFromYup
          name="descricao"
          :schema="schema"
        />
        <Field
          id="descricao"
          name="descricao"
          type="text"
          maxlength="250"
          class="inputtext light mb1"
        />
        <ErrorMessage
          name="descricao"
          class="error-msg"
        />
      </div>
    </div>

    <FormErrorsList :errors="errors" />

    <div class="flex spacebetween center mb2">
      <hr class="mr2 f1">
      <button
        class="btn big"
        :disabled="isSubmitting || Object.keys(errors)?.length"
        :title="
          Object.keys(errors)?.length
            ? `Erros de preenchimento: ${Object.keys(errors)?.length}`
            : null
        "
      >
        Salvar
      </button>
      <hr class="ml2 f1">
    </div>
  </Form>

  <div
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >
    Carregando
  </div>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
