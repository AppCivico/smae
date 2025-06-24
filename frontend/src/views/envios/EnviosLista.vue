<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { useImportaçõesStore } from '@/stores/importacoes.store.ts';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

defineOptions({
  inheritAttrs: false,
});

const importaçõesStore = useImportaçõesStore();
const {
  chamadasPendentes, erro, lista, listaPreparada, paginação,
} = storeToRefs(importaçõesStore);
const route = useRoute();
const emit = defineEmits(['enviado']);
const colunas = [
  {
    chave: 'arquivo',
    label: 'Arquivo original',
  },
  {
    chave: 'saida_arquivo',
    label: 'Arquivo processado',
  },
  {
    chave: 'status',
    label: 'Status',
  },

  {
    chave: 'criado_por',
    label: 'Enviado por',
  },
  {
    chave: 'criado_em',
    atributosDaCelula: {
      class: 'col--minimum',
    },
    atributosDaColuna: {
      class: 'col--dataHora',
    },
  },
];
const listaFiltradaPorTermoDeBusca = ref([]);

function carregar(parametros) {
  if (!parametros.portfolio_id && !parametros.pdm_id && ['portfolio', 'mdo'].indexOf(route.meta.entidadeMãe) > -1) {
    importaçõesStore.buscarTudo({ ...parametros, apenas_com_portfolio: true });
  } else {
    importaçõesStore.buscarTudo(parametros);
  }
}

if (['portfolio', 'mdo'].indexOf(route.meta.entidadeMãe) > -1 && !route.query.portfolio_id) {
  colunas
    .splice(2, 0, {
      chave: 'nome_do_portfolio',
      label: 'Portfolio',
    });
}

watch(() => route.query, () => {
  importaçõesStore.lista = [];

  carregar(route.query);
}, { immediate: true });
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

  <ErrorComponent
    v-if="erro"
    :erro="erro"
    class="mb1"
  />

  <SmaeTable
    v-if="!chamadasPendentes.lista || lista.length"
    :dados="listaFiltradaPorTermoDeBusca"
    :colunas="colunas"
    :aria-busy="chamadasPendentes.lista"
    class="mb1"
    titulo-para-rolagem-horizontal="Lista de arquivos enviados"
    rolagem-horizontal
  >
    <template #celula:arquivo="{ celula }">
      <SmaeLink
        v-if="celula"
        :to="celula.href"
        target="_blank"
        :download="celula.download || celula.texto"
        rel="noopener noreferrer"
      >
        {{ celula.texto }}
      </SmaeLink>
      <template v-else>
        Arquivo não disponível
      </template>
    </template>
    <template #celula:saida_arquivo="{ celula }">
      <SmaeLink
        v-if="celula"
        :to="celula.href"
        target="_blank"
        :download="celula.download || celula.texto"
        rel="noopener noreferrer"
      >
        {{ celula.texto }}
      </SmaeLink>
      <template v-else>
        Arquivo não disponível
      </template>
    </template>
  </SmaeTable>

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
