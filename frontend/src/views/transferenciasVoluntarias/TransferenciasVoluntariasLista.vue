<script setup>
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';

const transferenciasVoluntarias = useTransferenciasVoluntariasStore();
const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();
const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

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

  <table class="tablemain mb1">
    <col class="col--botão-de-ação">
    <col>
    <col>
    <col>
    <col>
    <col>
    <col>
    <col>
    <col>
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th />
        <th>
          Identificador
        </th>
        <th>
          Esfera
        </th>
        <th>
          Tipo
        </th>
        <th>
          Partido
        </th>
        <th>
          Parlamentar
        </th>
        <th>
          Órgão Gestor
        </th>
        <th>
          Etapa
        </th>
        <th>
          Fase
        </th>
        <th>
          Status da Fase
        </th>
        <th>
          Objeto/Empreendimento
        </th>
        <th class="cell--number">
          Valor
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>
          <span
            v-if="item.pendente_preenchimento_valores"
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
        </td>
        <th>
          <router-link
            :to="{
              name: 'TransferenciasVoluntariasDetalhes',
              params: { transferenciaId: item.id }
            }"
            class="tprimary"
          >
            {{ item.identificador }}
          </router-link>
        </th>
        <td>
          {{ item.esfera }}
        </td>
        <td>
          {{ item.tipo.nome }}
        </td>
        <td>
          {{ item.partido?.length ? item.partido?.map((e) => e.sigla).join(', ') : '-' }}
        </td>
        <td>
          {{ item.parlamentar?.length ? item.parlamentar?.map((e) => e.nome_popular).join(', ') : '-' }}
        </td>
        <td>
          {{ item.orgao_gestor?.length ? item.orgao_gestor?.map((e) => e.sigla).join(', ') : '-' }}
        </td>
        <td>
          {{ item.andamento_etapa? item.andamento_etapa : '-' }}
        </td>
        <td>
          {{ item.andamento_fase? item.andamento_fase : '-' }}
        </td>
        <td>
          {{ item.fase_status? item.fase_status : '-' }}
        </td>
        <td>
          {{ item.objeto }}
        </td>
        <td class="cell--number">
          {{ item.valor ? `R$${dinheiro(item.valor)}` : '-' }}
        </td>
        <td>
          <router-link
            v-if="temPermissãoPara([
              'CadastroTransferencia.administrador',
              'CadastroTransferencia.editar'
            ])"
            :to="{ name: 'TransferenciasVoluntariaEditar', params: { transferenciaId: item.id } }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_edit" />
            </svg>
          </router-link>
        </td>
        <td>
          <button
            v-if="temPermissãoPara([
              'CadastroTransferencia.administrador',
              'CadastroTransferencia.remover'
            ])"
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirTransferencia(item.id)"
          >
            <svg
              width="20"
              height="20"
            >
              <use xlink:href="#i_remove" />
            </svg>
          </button>
        </td>
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="12">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="12">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="12">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>

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
