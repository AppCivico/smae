<script setup>
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const transferenciasVoluntarias = useTransferenciasVoluntariasStore();
const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();

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
const esfera = ref(route.query.esfera);
const pendentePreenchimentoValores = ref(!!route.query.pendente_preenchimento_valores);

function atualizarUrl() {
  router.push({
    query: {
      ...route.query,
      ano: ano.value || undefined,
      esfera: esfera.value || undefined,
      pendente_preenchimento_valores: pendentePreenchimentoValores.value || undefined,
    },
  });
}

watch([
  () => route.query.ano,
  () => route.query.esfera,
  () => route.query.pendente_preenchimento_valores,
], () => {
  transferenciasVoluntarias.buscarTudo({
    ano: route.query.ano,
    esfera: route.query.esfera,
    pendente_preenchimento_valores: route.query.pendente_preenchimento_valores,
  });
}, { immediate: true });
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Tipo de Transferência' }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'TransferenciasVoluntariaCriar' }"
      class="btn big ml1"
    >
      Novo Formulário de registro
    </router-link>
  </div>

  <form
    class="flex bottom mb2 g1"
    @submit.prevent="atualizarUrl"
  >
    <div class="f0">
      <label class="label tc300">Ano</label>
      <input
        v-model="ano"
        class="inputtext"
        name="ano"
        type="number"
        min="2003"
      >
    </div>
    <div class="f0">
      <label class="label tc300">Esfera</label>
      <select
        v-model="esfera"
        class="inputtext"
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

    <div class="flex f0 center g1 mtauto">
      <label
        class="label tc300"
        for="pendentePreenchimentoValores"
      >
        apenas completas
      </label>
      <input
        v-model="pendentePreenchimentoValores"
        name="pendente_preenchimento_valores"
        type="checkbox"
        :value="true"
      >
    </div>

    <button class="btn outline bgnone mtauto">
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
          Tipo de transferência
        </th>
        <th>
          Partido
        </th>
        <th>
          Ano
        </th>
        <th>
          Objeto/Empreendimento
        </th>
        <th>
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
          {{ item.partido?.sigla }}
        </td>
        <td>
          {{ item.ano }}
        </td>
        <td>
          {{ item.objeto }}
        </td>
        <td>
          {{ item.valor ? `R$${dinheiro(item.valor)}` : '-' }}
        </td>
        <td>
          <button
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
        <td>
          <router-link
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
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="10">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="10">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="10">
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
