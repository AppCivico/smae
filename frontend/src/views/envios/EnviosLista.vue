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
const emit = defineEmits(['enviado']);
const colunas = [
  {
    nomeDaPropriedade: 'arquivo',
    etiqueta: 'Arquivo original',
    classe: '',
  },
  {
    nomeDaPropriedade: 'saida_arquivo',
    etiqueta: 'Arquivo processado',
    classe: '',
  },
  {
    nomeDaPropriedade: 'status',
    etiqueta: 'Status',
    classe: '',
  },

  {
    nomeDaPropriedade: 'criado_por',
    etiqueta: 'enviado por',
    classe: '',
  },
  {
    nomeDaPropriedade: 'criado_em',
    classe: 'col--minimum',
  },
];
const listaFiltradaPorTermoDeBusca = ref([]);

function carregar(parâmetros) {
  if (!parâmetros.portfolio_id && !parâmetros.pdm_id && ['portfolio', 'mdo'].indexOf(route.meta.entidadeMãe) > -1) {
    importaçõesStore.buscarTudo({ ...parâmetros, apenas_com_portfolio: true });
  } else {
    importaçõesStore.buscarTudo(parâmetros);
  }
}

if (['portfolio', 'mdo'].indexOf(route.meta.entidadeMãe) > -1 && !route.query.portfolio_id) {
  colunas
    .splice(2, 0, {
      nome: 'nome_do_portfolio',
      etiqueta: 'Portfolio',
    });
}

watch(() => route.query, () => {
  importaçõesStore.lista = [];

  carregar(route.query);
}, { immediate: true });
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex center mb2 spacebetween">
    <slot name="filtro" />

    <LocalFilter
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="listaPreparada"
    />
  </div>

  <slot name="pre-lista" />

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
    v-if="paginação.temMais && paginação.tokenDaPróximaPágina"
    :disabled="chamadasPendentes.lista"
    class="btn bgnone outline center"
    @click="carregar({ ...route.query, token_proxima_pagina: paginação.tokenDaPróximaPágina })"
  >
    carregar mais
  </button>

  <router-view
    @enviado="() => {
      carregar($route.query);
      emit('enviado')
    }"
  />
</template>
