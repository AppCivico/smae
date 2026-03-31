<script setup>
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { FiltroEnvioDeEmailsSchema } from '@/consts/formSchemas/demanda';
import dateToDate from '@/helpers/dateToDate';
import { useEnvioDeEmailsStore } from '@/stores/envioDeEmails.store';

const route = useRoute();
const envioDeEmailsStore = useEnvioDeEmailsStore();
const { lista, paginacao, chamadasPendentes } = storeToRefs(envioDeEmailsStore);

const colunas = [
  { chave: 'assunto', label: 'Assunto' },
  { chave: 'nomes_parlamentares', label: 'Parlamentares' },
  { chave: 'criado_em', label: 'Enviado em', formatador: dateToDate },
  { chave: 'criado_por.nome_exibicao', label: 'Enviado por' },
];

const camposDeFiltro = computed(() => [
  {
    campos: {
      palavra_chave: { tipo: 'search' },
      criado_em: { tipo: 'date' },
    },
  },
]);

function buscarDados() {
  envioDeEmailsStore.buscarTudo({
    pagina: route.query?.pagina,
    palavra_chave: [route.query?.criado_em, route.query?.palavra_chave].filter(Boolean).join(' ') || undefined,
    token_proxima_pagina: route.query?.token_paginacao,
  });
}

async function handleEnviarEmail() {
  await envioDeEmailsStore.dispararEmail();
  buscarDados();
}

watch(
  () => [
    route.query?.pagina,
    route.query?.palavra_chave,
    route.query?.criado_em,
    route.query?.token_paginacao,
  ],
  () => {
    buscarDados();
  },
  { immediate: true },
);
</script>

<template>
  <CabecalhoDePagina>
    <template #acoes>
      <button
        class="btn big"
        type="button"
        @click="handleEnviarEmail"
      >
        Enviar e-mail
      </button>
    </template>
  </CabecalhoDePagina>

  <FiltroParaPagina
    :formulario="camposDeFiltro"
    :schema="FiltroEnvioDeEmailsSchema"
    :carregando="chamadasPendentes.lista"
  />

  <SmaeTable
    :colunas="colunas"
    :dados="lista || []"
  >
    <template #celula:nomes_parlamentares="{ linha }">
      <span :title="linha.nomes_parlamentares">
        {{ linha.nomes_parlamentares }}
      </span>
    </template>
  </SmaeTable>

  <MenuPaginacao
    class="mt2"
    v-bind="paginacao"
  />
</template>
