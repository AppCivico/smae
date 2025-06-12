<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { orderBy } from 'lodash';
import * as CardEnvelope from '@/components/cardEnvelope';
import MonitoramentoCard from '@/components/transferencia/MonitoramentoCard.vue';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import ListaLegendas from '@/components/ListaLegendas.vue';

const { params } = useRoute();

const distribuicaoRecursos = useDistribuicaoRecursosStore();
const { chamadasPendentes, lista } = storeToRefs(distribuicaoRecursos);

distribuicaoRecursos.buscarTudo({ transferencia_id: params.transferenciaId });

const legendas = {
  status: [
    { item: 'Finalizada', color: '#00b300' },
    { item: 'Em curso', color: '#ffda00' },
    { item: 'Registro histórico', color: '#ff0000' },
  ],
};

const statusFinalizada = new Set(['ConcluidoComSucesso', 'EncerradoSemSucesso']);
const statusCancelada = new Set(['Terminal', 'Cancelada']);

function statusPrioridade(tipo) {
  if (statusFinalizada.has(tipo)) return 1;
  if (statusCancelada.has(tipo)) return 2;
  return 0;
}

const listaOrdenada = computed(() => orderBy(lista.value, (recurso) => {
  const tipo = recurso.historico_status?.[0]?.status_customizado?.tipo
    || recurso.historico_status?.[0]?.status_base?.tipo || '';

  return statusPrioridade(tipo);
}));
</script>
<template>
  <LoadingComponent v-if="chamadasPendentes.lista" />
  <template
    v-else
  >
    <CardEnvelope.Conteudo class="flex column g1">
      <CardEnvelope.Titulo
        titulo="Distribuição de Recursos"
        icone="money-exchange"
      />

      <ListaLegendas
        :legendas="legendas"
        :borda="false"
        :duas-linhas="true"
        align="right"
        orientacao="horizontal"
      />

      <p v-if="!listaOrdenada?.length">
        Nenhuma distribuição de recursos encontrada.
      </p>
      <div
        v-else
        class="lista-cards"
      >
        <MonitoramentoCard
          v-for="recurso in listaOrdenada"
          :key="recurso.id"
          :recurso="recurso"
        />
      </div>
    </CardEnvelope.Conteudo>
  </template>
</template>
<style scoped>
.lista-cards {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 285px;
  gap: 3rem;
  overflow-x: auto;

  padding: 1rem 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #888 #f0f0f0;
}
</style>
