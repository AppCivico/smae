<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import TabelaGenérica from '@/components/TabelaGenerica.vue';
import { useImportaçõesStore } from '@/stores/importacoes.store.ts';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const importaçõesStore = useImportaçõesStore();
const {
  chamadasPendentes, erro, lista, listaPreparada, paginação,
} = storeToRefs(importaçõesStore);
const route = useRoute();
const colunas = [
  {
    nome: 'arquivo',
    etiqueta: 'Arquivo original',
    classe: '',
  },
  {
    nome: 'saida_arquivo',
    etiqueta: 'Arquivo processado',
    classe: '',
  },
  {
    nome: 'status',
    etiqueta: 'Status',
    classe: '',
  },

  {
    nome: 'criado_por',
    etiqueta: 'enviado por',
    classe: '',
  },
  {
    nome: 'criado_em',

    classe: 'col--minimum',
  },
];
const listaFiltradaPorTermoDeBusca = ref([]);

function iniciar(parâmetros) {
  if (!parâmetros.portfolio_id && !parâmetros.pdm_id) {
    importaçõesStore.$reset();
  } else {
    importaçõesStore.buscarTudo(parâmetros);
  }
}

watch(route.query, () => {
  iniciar(route.query);
});

importaçõesStore.$reset();

iniciar(route.query);
</script>
<template>
  <div class="flex center mb2 spacebetween">
    <LocalFilter
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="listaPreparada"
    />
    <hr class="ml1 f1">
  </div>

  <div
    v-if="chamadasPendentes.lista && !lista.length"
    aria-busy="true"
  >
    Carregando
  </div>

  <TabelaGenérica
    v-if="!chamadasPendentes.lista || lista.length"
    :lista="listaFiltradaPorTermoDeBusca"
    :colunas="colunas"
    :erro="erro"
    :chamadas-pendentes="chamadasPendentes"
    class="mb1"
  />

  <button
    v-if="paginação.temMais"
    :disabled="chamadasPendentes.lista"
    class="btn bgnone outline center"
    @click="iniciar({ ...route.query, token_proxima_pagina: paginação.tokenDaPróximaPágina })"
  >
    carregar mais
  </button>
</template>
