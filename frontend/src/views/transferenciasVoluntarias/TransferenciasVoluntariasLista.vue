<script setup>
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useRoute } from 'vue-router';

import FiltroParaPagina from '@/components/FiltroParaPagina.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import schema from '@/consts/formSchemas/transferenciasVoluntariasFiltro';
import combinadorDeListas from '@/helpers/combinadorDeListas';
import dinheiro from '@/helpers/dinheiro';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

const transferenciasVoluntarias = useTransferenciasVoluntariasStore();
const route = useRoute();
const alertStore = useAlertStore();
const authStore = useAuthStore();
const { temPermissãoPara } = authStore;

const {
  lista, chamadasPendentes, erro, paginação,
} = storeToRefs(transferenciasVoluntarias);

async function excluirTransferencia(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await transferenciasVoluntarias.excluirItem(id)) {
      transferenciasVoluntarias.buscarTudo();
      alertStore.success('Transferência removida.');
    }
  }, 'Remover');
}

const camposDeFiltro = [{
  campos: {
    ano: { tipo: 'numeric', atributos: { min: 2003, max: 9999 } },
    esfera: {
      tipo: 'select',
      opcoes: Object.values(esferasDeTransferencia).map((e) => ({ id: e.valor, label: e.nome })),
    },
    cancelada: {
      tipo: 'select',
      opcoes: [{ id: 'true', label: 'Sim' }, { id: 'false', label: 'Não' }],
    },
    preenchimento_completo: {
      tipo: 'select',
      opcoes: [{ id: 'true', label: 'Sim' }, { id: 'false', label: 'Não' }],
    },
    palavra_chave: { tipo: 'text' },
  },
}];

function paraValorEscalar(valor) {
  return Array.isArray(valor) ? valor[0] : valor;
}

watch([
  () => route.query.ano,
  () => route.query.esfera,
  () => route.query.palavra_chave,
  () => route.query.preenchimento_completo,
  () => route.query.cancelada,
], () => {
  const esfera = paraValorEscalar(route.query.esfera);

  let anoParaBusca = paraValorEscalar(route.query.ano);
  let palavraChaveParaBusca = paraValorEscalar(route.query.palavra_chave);
  if (typeof anoParaBusca === 'string') {
    anoParaBusca = anoParaBusca.trim();
  }
  if (typeof palavraChaveParaBusca === 'string') {
    palavraChaveParaBusca = palavraChaveParaBusca.trim();
  }
  transferenciasVoluntarias.$reset();
  transferenciasVoluntarias.buscarTudo({
    ano: anoParaBusca,
    esfera: esfera
      ? Object.keys(esferasDeTransferencia)
        .find((x) => x.toLowerCase() === esfera.toLocaleLowerCase())
      : undefined,
    palavra_chave: palavraChaveParaBusca,
    preenchimento_completo: paraValorEscalar(route.query.preenchimento_completo) || undefined,
    cancelada: paraValorEscalar(route.query.cancelada) || undefined,
  });
}, { immediate: true });

</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara([
        'CadastroTransferencia.administrador',
        'CadastroTransferencia.inserir'
      ]) "
      :to="{ name: 'TransferenciasVoluntariaCriar' }"
      class="btn big ml1"
    >
      Nova transferência
    </router-link>
  </div>

  <FiltroParaPagina
    class="mb2"
    :formulario="camposDeFiltro"
    :schema="schema"
    :carregando="chamadasPendentes.lista"
  />

  <SmaeTable
    class="mb1"
    :dados="lista"
    rolagem-horizontal
    titulo-para-rolagem-horizontal="Lista de transferências voluntárias"
    :colunas="[
      {
        chave: 'alerta',
        label: '',
        permitirValorVazio: true,
        atributosDaColuna: { class: 'col--botão-de-ação' },
      },
      { chave: 'emenda', label: 'Emenda' },
      { chave: 'identificador', label: 'Identificador', ehCabecalho: true },
      { chave: 'esfera', label: 'Esfera' },
      { chave: 'tipo.nome', label: 'Tipo' },
      { chave: 'partido', label: 'Partido' },
      { chave: 'parlamentar', label: 'Parlamentar' },
      { chave: 'orgao_gestor', label: 'Órgão Gestor' },
      { chave: 'andamento_etapa', label: 'Etapa' },
      { chave: 'andamento_fase', label: 'Fase' },
      { chave: 'fase_status', label: 'Status da Fase' },
      { chave: 'objeto', label: 'Objeto/Empreendimento' },
      {
        chave: 'valor',
        label: 'Valor',
        atributosDaCelula: { class: 'cell--number' },
        atributosDoCabecalhoDeColuna: { class: 'cell--number' },
      },
    ]"
  >
    <template #celula:alerta="{ linha }">
      <span
        v-if="linha.pendente_preenchimento_valores"
        class="tipinfo right"
      >
        <svg
          width="24"
          height="24"
          color="#F2890D"
        ><use xlink:href="#i_alert" /></svg><div>
          Preenchimento incompleto
        </div>
      </span>
    </template>

    <template #celula:identificador="{ linha }">
      <router-link
        :to="{
          name: 'TransferenciasVoluntariasDetalhes',
          params: { transferenciaId: linha.id }
        }"
        class="tprimary"
      >
        {{ linha.identificador }}
      </router-link>
    </template>

    <template #celula:partido="{ linha }">
      {{ combinadorDeListas(linha.partido, ', ', 'sigla') }}
    </template>

    <template #celula:parlamentar="{ linha }">
      {{ combinadorDeListas(linha.parlamentar, ', ', 'nome_popular') }}
    </template>

    <template #celula:orgao_gestor="{ linha }">
      {{ combinadorDeListas(linha.orgao_gestor, ', ', 'sigla') }}
    </template>

    <template #celula:andamento_fase="{ linha }">
      <span :title="linha.andamento_fase?.length > 35 ? linha.andamento_fase : undefined">
        {{ truncate(linha.andamento_fase, 35) }}
      </span>
    </template>

    <template #celula:objeto="{ linha }">
      <span :title="linha.objeto?.length > 35 ? linha.objeto : undefined">
        {{ truncate(linha.objeto, 35) }}
      </span>
    </template>

    <template #celula:valor="{ linha }">
      {{ linha.valor ? `R$${dinheiro(linha.valor)}` : '-' }}
    </template>

    <template #acoes="{ linha }">
      <router-link
        v-if="temPermissãoPara([
          'CadastroTransferencia.administrador',
          'CadastroTransferencia.editar'
        ])"
        :to="{ name: 'TransferenciasVoluntariaEditar', params: { transferenciaId: linha.id } }"
        class="tprimary"
      >
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_edit" />
        </svg>
      </router-link>
      <button
        v-if="temPermissãoPara([
          'CadastroTransferencia.administrador',
          'CadastroTransferencia.remover'
        ])"
        class="like-a__text"
        aria-label="excluir"
        title="excluir"
        @click="excluirTransferencia(linha.id)"
      >
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_remove" />
        </svg>
      </button>
    </template>
  </SmaeTable>

  <LoadingComponent v-if="chamadasPendentes.lista" />
  <ErrorComponent
    v-else-if="erro"
    :erro="erro"
  />

  <button
    v-if="paginação.temMais && paginação.tokenDaPróximaPágina"
    :disabled="chamadasPendentes.lista"
    class="btn bgnone outline center"
    @click="transferenciasVoluntarias.buscarTudo({
      ...route.query,
      token_proxima_pagina: paginação.tokenDaPróximaPágina
    })"
  >
    carregar mais
  </button>
</template>
