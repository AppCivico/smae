<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
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
        for="tipo"
        class="label tc300"
      >Modalidade</label>
      <select
        id="tipo"
        v-model.trim="tipo"
        class="inputtext mb1"
        name="tipo"
      >
        <option value="" />
        <option
          v-for="(tipo, id) in tipos"
          :key="id"
          :value="tipo.value"
        >
          {{ tipo.name }}
        </option>
      </select>
    </div>

    <div class="f0">
      <label
        for="palavras_chave"
        class="label tc300"
      >Palavra-chave</label>
      <input
        id="palavras_chave"
        v-model.trim="palavraChave"
        class="inputtext"
        name="palavras_chave"
        type="text"
      >
    </div>
    <button class="btn outline bgnone tcprimary mtauto mb1">
      Filtrar
    </button>
  </form>
  <!-- <pre>{{ lista }}</pre> -->

  <table class="tablemain mb1">
    <col>
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
    <thead>
      <tr>
        <th>
          Órgão
        </th>
        <th>
          Programa
        </th>
        <th>
          Código do programa
        </th>
        <th>
          Situação
        </th>
        <th>
          Data de disponibilização
        </th>
        <th>
          Início das propostas
        </th>
        <th>
          Fim das propostas
        </th>
        <th>
          Modalidade
        </th>
        <th>
          Ação Orçamentária
        </th>
        <th>
          Avaliação
        </th>
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>
          {{ item.desc_orgao_sup_programa || ' - ' }}
        </td>
        <td>
          {{ item.nome_programa || ' - ' }}
        </td>
        <td>
          {{ item.cod_programa || ' - ' }}
        </td>
        <td>
          {{ item.sit_programa || ' - ' }}
        </td>
        <td>
          {{ item.data_disponibilizacao || ' - ' }}
        </td>
        <td>
          {{ item.dt_ini_receb || ' - ' }}
        </td>
        <td>
          {{ item.dt_fim_receb || ' - ' }}
        </td>
        <td>
          {{ item.modalidade_programa || ' - ' }}
        </td>
        <td>
          {{ item.acao_orcamentaria || ' - ' }}
        </td>
        <td>
          {{ item.avaliacao || 'Não avaliado' }}
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
              <use xlink:href="#i_edit" />
            </svg>
          </button>
        </td>
        <td />
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="11">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="11">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="11">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>

  <button
    v-if="paginação.temMais && paginação.tokenDaPróximaPágina"
    :disabled="chamadasPendentes.lista"
    class="btn bgnone outline center"
    @click="oportunidades.buscarTudo({
      ...route.query,
      token_proxima_pagina: paginação.tokenDaPróximaPágina
    })"
  >
    carregar mais
  </button>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAlertStore } from '@/stores/alert.store';
import { useOportunidadesStore } from '@/stores/oportunidades.store';

const route = useRoute();
const router = useRouter();
const oportunidades = useOportunidadesStore();
// const transferenciasVoluntarias = useTransferenciasVoluntariasStore();

const alertStore = useAlertStore();

const ano = ref(route.query.ano);
const palavras_chave = ref(route.query.palavras_chave);

const {
  lista, chamadasPendentes, erro, paginação,
} = storeToRefs(oportunidades);

const tipos = [
  {
    value: 'voluntaria',
    name: 'Voluntária',
  },
  {
    value: 'especifica',
    name: 'Específica',
  },
  {
    value: 'emenda',
    name: 'Emenda',
  },
];

function atualizarUrl() {
  router.push({
    query: {
      ...route.query,
      ano: ano.value || undefined,
      palavras_chave: palavraChave.value || undefined,
    },
  });
}

watch([
  () => route.query.ano,
  () => route.query.palavras_chave,
], () => {
  console.log('entrou no watch');
  let { ano: anoParaBusca, palavras_chave: palavraChaveParaBusca } = route.query;
  if (typeof anoParaBusca === 'string') {
    anoParaBusca = anoParaBusca.trim();
  }
  if (typeof palavraChaveParaBusca === 'string') {
    palavraChaveParaBusca = palavraChaveParaBusca.trim();
  }
  oportunidades.$reset();
  oportunidades.buscarTudo({
    ano: anoParaBusca,
    palavras_chave: palavraChaveParaBusca,
  });
}, { immediate: true });

</script>
