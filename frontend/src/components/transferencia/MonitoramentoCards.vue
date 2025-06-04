<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
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

      <div class="lista-cards">
        <MonitoramentoCard
          v-for="recurso in lista"
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
