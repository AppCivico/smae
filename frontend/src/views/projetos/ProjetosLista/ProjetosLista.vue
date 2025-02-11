<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import MigalhasDePao from '@/components/MigalhasDePao.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import ProjetosListaFiltro from './partials/ProjetosListaFiltro.vue';
import { useProjetosStore } from '@/stores/projetos.store';
import dinheiro from '@/helpers/dinheiro';
import dateIgnorarTimezone from '@/helpers/dateIgnorarTimezone';

const route = useRoute();
const projetosStore = useProjetosStore();

const listaDeProjetos = computed(() => projetosStore.listaV2);

watch(() => route.query, (query) => {
  projetosStore.buscarTudoV2(query);
});
</script>

<template>
  <MigalhasDePao />

  <section class="projetos-lista">
    <div class="projetos-lista__header flex spacebetween center mb2">
      <TituloDaPagina />
    </div>

    <ProjetosListaFiltro />

    <SmaeTable
      class="mt2"
      :dados="listaDeProjetos"
      :colunas="[
        { chave: 'orgao_responsavel.descricao', label: 'Órgão Responsável' },
        { chave: 'portfolio.titulo', label: 'Portfólio' },
        { chave: 'nome', label: 'Nome do Projeto' },
        { chave: 'status', label: 'Status' },
        { chave: 'previsao_termino', label: 'Término Planejado' },
        { chave: 'previsao_custo', label: 'Custo Total Planejado' },
      ]"
    >
      <template #celula:status="{ linha }">
        {{ linha.status }}
      </template>

      <template #celula:previsao_termino="{ linha }">
        {{ dateIgnorarTimezone(linha.previsao_termino, 'MM/yyyy') || '-' }}
      </template>

      <template #celula:previsao_custo="{ linha }">
        {{ dinheiro(linha.previsao_custo) }}
      </template>
    </SmaeTable>
  </section>
</template>
