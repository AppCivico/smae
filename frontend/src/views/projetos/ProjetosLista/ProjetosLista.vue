<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import MigalhasDePao from '@/components/MigalhasDePao.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { useProjetosStore } from '@/stores/projetos.store';
import dinheiro from '@/helpers/dinheiro';
import dateIgnorarTimezone from '@/helpers/dateIgnorarTimezone';
import projectStatuses from '@/consts/projectStatuses';
import ProjetosListaFiltro from './partials/ProjetosListaFiltro.vue';

const route = useRoute();
const projetosStore = useProjetosStore();

const listaDeProjetos = computed(() => projetosStore.listaV2);

function obterStatus(status: string) {
  const mapaDeEstatus = projectStatuses as Record<string, string>;
  return mapaDeEstatus[status] || status;
}

watch(() => route.query, (query) => {
  projetosStore.buscarTudoV2(query);
}, { immediate: true });
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
        { chave: 'portfolio.titulo', label: 'Portfólio' },
        { chave: 'orgao_responsavel.descricao', label: 'Órgão Responsável' },
        { chave: 'nome', label: 'Nome do Projeto' },
        { chave: 'status', label: 'Status' },
        { chave: 'previsao_termino', label: 'Término Planejado' },
        { chave: 'previsao_custo', label: 'Custo Total Planejado' },
      ]"
      parametro-da-rota-editar="projetoId"
      parametro-no-objeto-para-editar="id"
      parametro-no-objeto-para-excluir="portfolio.titulo"
      :rota-editar="{ name: 'projetosEditar' }"
    >
      <template #['celula:orgao_responsavel.descricao']="{ linha }">
        {{ linha.orgao_responsavel?.descricao || '-' }}
      </template>

      <template #celula:status="{ linha }">
        {{ obterStatus(linha.status) }}
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

<style lang="less" scoped>
.projetos-lista {
  :deep {
    .table-cell--status {
      white-space: nowrap;
      text-transform: uppercase;
    }

    .table-cell--previsao_termino {
      text-align: center;
    }
  }
}
</style>
