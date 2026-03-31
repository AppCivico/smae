<script setup>
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useRoute } from 'vue-router';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import dateToDate from '@/helpers/dateToDate';
import { useEnvioDeEmailsStore } from '@/stores/envioDeEmails.store';

const route = useRoute();
const envioDeEmailsStore = useEnvioDeEmailsStore();
const { lista, paginacao } = storeToRefs(envioDeEmailsStore);

const colunas = [
  { chave: 'assunto', label: 'Assunto' },
  { chave: 'nomes_parlamentares', label: 'Parlamentares' },
  { chave: 'criado_em', label: 'Enviado em', formatador: dateToDate },
  { chave: 'criado_por.nome_exibicao', label: 'Enviado por' },
];

function buscarDados() {
  envioDeEmailsStore.buscarTudo({
    pagina: route.query?.pagina,
    palavra_chave: route.query?.palavra_chave,
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
