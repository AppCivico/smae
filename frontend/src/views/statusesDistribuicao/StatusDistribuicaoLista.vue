<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import tiposStatusDistribuicao from '@/consts/tiposStatusDistribuicao';
import { useAlertStore } from '@/stores/alert.store';
import { useStatusDistribuicaoWorflowStore } from '@/stores/statusDistribuicaoWorkflow.store';

const route = useRoute();
const titulo = typeof route?.meta?.título === 'function'
  ? computed(() => route.meta.título())
  : route?.meta?.título;
const alertStore = useAlertStore();
const statusDistribuicaoWorflowStore = useStatusDistribuicaoWorflowStore();
const { lista, chamadasPendentes, erro } = storeToRefs(statusDistribuicaoWorflowStore);

async function excluirStatusDistribuicao(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await statusDistribuicaoWorflowStore.excluirItem(id)) {
        statusDistribuicaoWorflowStore.$reset();
        statusDistribuicaoWorflowStore.buscarTudo();
        alertStore.success(`"${descricao}" removido.`);
      }
    },
    'Remover',
  );
}

statusDistribuicaoWorflowStore.$reset();
statusDistribuicaoWorflowStore.buscarTudo({});
</script>

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
  <SmaeTable
    :dados="lista"
    :colunas="[
      { chave: 'nome', label: 'Nome' },
      {
        chave: 'tipo',
        label: 'Tipo',
        formatador: (valor) => tiposStatusDistribuicao[valor]?.nome ?? valor ?? '-',
      },
    ]"
  >
    <template #acoes="{ linha }">
      <router-link
        v-if="linha.pode_editar"
        :to="{ name: 'statusDistribuicaoEditar', params: { statusDistribuicaoId: linha.id } }"
        class="tprimary"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_edit" /></svg>
      </router-link>
      <button
        v-if="linha.pode_editar"
        class="like-a__text"
        aria-label="excluir"
        title="excluir"
        @click="excluirStatusDistribuicao(linha.id, linha.nome)"
      >
        <svg
          width="20"
          height="20"
        ><use xlink:href="#i_remove" /></svg>
      </button>
    </template>
  </SmaeTable>

  <p v-if="chamadasPendentes.lista">
    Carregando
  </p>
  <p v-else-if="erro">
    Erro: {{ erro }}
  </p>
</template>
