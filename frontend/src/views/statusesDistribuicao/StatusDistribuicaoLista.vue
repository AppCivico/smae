<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'statusDistribuicaoCriar' }"
      class="btn big ml1"
    >
      Novo {{ titulo }}
    </router-link>
  </div>
  <table class="tablemain">
    <col>
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>
          Nome
        </th>
        <th>
          Tipo
        </th>
        <th />
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>{{ item.nome }}</td>
        <td>{{ item.tipo }}</td>
        <td>
          <router-link
            v-if="item.pode_editar"
            :to="{ name: 'statusDistribuicaoEditar', params: { statusDistribuicaoId: item.id } }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
        <td>
          <button
            v-if="item.pode_editar"
            class="like-a__text"
            aria-label="excluir"
            title="excluir"
            @click="excluirStatusDistribuicao(item.id, item.nome)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="4">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="4">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="4">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { useStatusDistribuicaoWorflowStore } from '@/stores/statusDistribuicaoWorkflow.store';

const route = useRoute();
const titulo = typeof route?.meta?.título === 'function'
  ? computed(() => route.meta.título())
  : route?.meta?.título;
const alertStore = useAlertStore();
const statusDistribuicaoStore = useStatusDistribuicaoWorflowStore();
const { lista, chamadasPendentes, erro } = storeToRefs(statusDistribuicaoStore);

async function excluirStatusDistribuicao(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await statusDistribuicaoStore.excluirItem(id)) {
        statusDistribuicaoStore.$reset();
        statusDistribuicaoStore.buscarTudo();
        alertStore.success(`"${descricao}" removido.`);
      }
    },
    'Remover',
  );
}

statusDistribuicaoStore.$reset();
statusDistribuicaoStore.buscarTudo({});
</script>

  <style></style>
