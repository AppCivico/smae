<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useWorkflowTarefasStore } from '@/stores/workflowTarefas.store';
import { storeToRefs } from 'pinia';

const workflowTarefas = useWorkflowTarefasStore();
const { listaOrdenada: lista, chamadasPendentes, erro } = storeToRefs(workflowTarefas);

const alertStore = useAlertStore();

async function excluirTarefa(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await workflowTarefas.excluirItem(id)) {
      workflowTarefas.buscarTudo();
      alertStore.success('Tarefa removida.');
    }
  }, 'Remover');
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <SmaeLink
      :to="{
        name: 'workflow.TarefasCriar'
      }"
      class="btn big ml2"
    >
      Nova tarefa
    </SmaeLink>
  </div>
  <table class="tablemain">
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>
          Tarefa
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>{{ item.descricao }}</td>
        <td>
          <SmaeLink
            :to="{
              name: 'workflow.TarefasEditar',
              params: { tarefasId: item.id }
            }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </SmaeLink>
        </td>
        <td>
          <button
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirTarefa(item.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="3">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="3">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="3">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
