<script setup>
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import combinadorDeListas from '@/helpers/combinadorDeListas';
import dinheiro from '@/helpers/dinheiro';
import truncate from '@/helpers/texto/truncate';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

const transferenciasVoluntarias = useTransferenciasVoluntariasStore();
const route = useRoute();
const router = useRouter();
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

const ano = ref(route.query.ano);
const esfera = ref(route.query.esfera
  ? Object.keys(esferasDeTransferencia)
    .find((x) => x.toLowerCase() === route.query.esfera.toLocaleLowerCase())
  : undefined);
const palavraChave = ref(route.query.palavra_chave);
const apenasPreenchimentoCompleto = ref(!!route.query.preenchimento_completo);

function atualizarUrl() {
  router.push({
    query: {
      ...route.query,
      ano: ano.value || undefined,
      esfera: esfera.value || undefined,
      palavra_chave: palavraChave.value || undefined,
      preenchimento_completo: !!apenasPreenchimentoCompleto.value || undefined,
    },
  });
}

watch([
  () => route.query.ano,
  () => route.query.esfera,
  () => route.query.palavra_chave,
  () => route.query.preenchimento_completo,
], () => {
  let { ano: anoParaBusca, palavra_chave: palavraChaveParaBusca } = route.query;
  if (typeof anoParaBusca === 'string') {
    anoParaBusca = anoParaBusca.trim();
  }
  if (typeof palavraChaveParaBusca === 'string') {
    palavraChaveParaBusca = palavraChaveParaBusca.trim();
  }
  transferenciasVoluntarias.$reset();
  transferenciasVoluntarias.buscarTudo({
    ano: anoParaBusca,
    esfera: route.query.esfera
      ? Object.keys(esferasDeTransferencia)
        .find((x) => x.toLowerCase() === route.query.esfera.toLocaleLowerCase())
      : undefined,
    palavra_chave: palavraChaveParaBusca,
    preenchimento_completo: !!route.query.preenchimento_completo || undefined,
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

  <form
    class="flex flexwrap bottom mb2 g1"
    @submit.prevent="atualizarUrl"
  >
    <div class="f0">
      <label
        for="ano"
        class="label tc300"
      >Ano</label>
      <input
        id="ano"
        v-model.number="ano"
        inputmode="numeric"
        class="inputtext mb1"
        name="ano"
        type="number"
        min="2003"
        max="9999"
      >
    </div>

    <div class="f0">
      <label
        for="esfera"
        class="label tc300"
      >Esfera</label>
      <select
        id="esfera"
        v-model.trim="esfera"
        class="inputtext mb1"
        name="esfera"
      >
        <option value="" />
        <option
          v-for="item in Object.values(esferasDeTransferencia)"
          :key="item.valor"
          :value="item.valor"
        >
          {{ item.nome }}
        </option>
      </select>
    </div>

    <div class="f0">
      <label
        for="palavra_chave"
        class="label tc300"
      >Palavra-chave</label>
      <input
        id="palavra_chave"
        v-model.trim="palavraChave"
        class="inputtext"
        name="palavra_chave"
        type="text"
      >
    </div>

    <div class="flex f0 center g1 mb1">
      <label
        class="label tc300 mt2 mb0"
        for="preenchimento_completo"
      >
        apenas completas
      </label>
      <input
        id="preenchimento_completo"
        v-model="apenasPreenchimentoCompleto"
        name="preenchimento_completo"
        type="checkbox"
        :value="true"
        class="mt2"
      >
    </div>

    <button class="btn outline bgnone tcprimary mtauto mb1">
      Pesquisar
    </button>
  </form>

  <SmaeTable
    class="mb1"
    :dados="lista"
    rolagem-horizontal
    titulo-para-rolagem-horizontal="Lista de transferências voluntárias"
    :colunas="[
      { chave: 'alerta', label: '', atributosDaColuna: { class: 'col--botão-de-ação' } },
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

  <p v-if="chamadasPendentes.lista">
    Carregando
  </p>
  <p v-else-if="erro">
    Erro: {{ erro }}
  </p>

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
