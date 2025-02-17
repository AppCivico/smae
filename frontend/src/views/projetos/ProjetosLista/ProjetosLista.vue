<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import MigalhasDePao from '@/components/MigalhasDePao.vue';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { useProjetosStore } from '@/stores/projetos.store';
import dinheiro from '@/helpers/dinheiro';
import dateIgnorarTimezone from '@/helpers/dateIgnorarTimezone';
import projectStatuses from '@/consts/projectStatuses';
import ProjetosListaFiltro from './partials/ProjetosListaFiltro.vue';

const route = useRoute();
const projetosStore = useProjetosStore();

const { ultimoVisitado } = storeToRefs(projetosStore);

const { paginacaoProjetos } = storeToRefs(projetosStore);

const listaDeProjetos = computed(() => projetosStore.listaV2);

function atualizarDados() {
  projetosStore.buscarTudoV2(route.query);
}

function alterarStatusRevsado(id: string, statusRevisao: boolean) {
  projetosStore.revisar(id, statusRevisao);
}

async function handleDesmarcarTodos() {
  await projetosStore.revisarTodos();

  atualizarDados();
}

async function handleDeletarItem({ id }) {
  await projetosStore.excluirItem(id);

  atualizarDados();
}

watch(() => route.query, () => {
  atualizarDados();
}, { immediate: true });
</script>

<template>
  <MigalhasDePao />

  <section class="projetos-lista">
    <div class="projetos-lista__header flex spacebetween center mb2">
      <TituloDaPagina />

      <hr class="ml2 f1">

      <SmaeLink
        :to="{ name: 'projetosCriar' }"
        class="btn big ml2"
      >
        Novo projeto
      </SmaeLink>
    </div>

    <ProjetosListaFiltro />

    <MenuPaginacao
      class="mt2 bgt"
      v-bind="paginacaoProjetos"
    />

    <SmaeTable
      class="mt2"
      :dados="listaDeProjetos"
      :colunas="[
        { chave: 'nome', label: 'Nome do Projeto' },
        { chave: 'portfolio.titulo', label: 'Portfólio' },
        { chave: 'orgao_responsavel.descricao', label: 'Órgão Responsável' },
        { chave: 'status', label: 'Status' },
        { chave: 'projeto_etapa', label: 'Etapa' },
        { chave: 'previsao_termino', label: 'Término Planejado' },
        { chave: 'previsao_custo', label: 'Custo Total Planejado' },
        { chave: 'revisado', label: 'Revisado' },
      ]"
      parametro-da-rota-editar="projetoId"
      parametro-no-objeto-para-editar="id"
      parametro-no-objeto-para-excluir="portfolio.titulo"
      :personalizar-linhas="{
        parametro: 'id',
        alvo: ultimoVisitado,
        classe: 'selecionado'
      }"
      :rota-editar="{ name: 'projetosEditar' }"
      @deletar="handleDeletarItem"
    >
      <template #cabecalho:acao>
        <button
          class="btn outline bgnone tcprimary"
          @click="handleDesmarcarTodos"
        >
          Desmarcar todas
        </button>
      </template>

      <template #['celula:nome']="{ linha }">
        <SmaeLink :to="{ name: 'projetosResumo', params: { projetoId: linha.id }}">
          {{ linha.nome }}
        </SmaeLink>
      </template>

      <template #['celula:orgao_responsavel.descricao']="{ linha }">
        {{ linha.orgao_responsavel?.descricao || '-' }}
      </template>

      <template #celula:status="{ linha }">
        {{ projectStatuses[linha.status]?.nome || linha.status }}
      </template>

      <template #celula:previsao_termino="{ linha }">
        {{ dateIgnorarTimezone(linha.previsao_termino, 'MM/yyyy') || '-' }}
      </template>

      <template #celula:previsao_custo="{ linha }">
        {{ dinheiro(linha.previsao_custo) || '-' }}
      </template>

      <template #celula:revisado="{ linha }">
        <input
          type="checkbox"
          class="interruptor"
          :checked="linha.revisado"
          @change="ev => alterarStatusRevsado(linha.id, ev.target.checked)"
        >
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
