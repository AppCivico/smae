<script setup>
import { storeToRefs } from 'pinia';
import {
  computed,
  onMounted,
  watch,
} from 'vue';
import { onBeforeRouteLeave, useRoute } from 'vue-router';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import combinadorDeListas from '@/helpers/combinadorDeListas';
import { localizarDataHorario } from '@/helpers/dateToDate';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';

const baseUrl = `${import.meta.env.VITE_API_URL}`;
const { temPermissãoPara } = storeToRefs(useAuthStore());
const relatóriosStore = useRelatoriosStore();
const route = useRoute();
const alertStore = useAlertStore();

let idDoIntervaloDeAtualizacao = 0;
let abaVisivel = true;

const fonte = computed(() => route.meta.fonteDoRelatorio);
const temAlgumRelatorioEmProcessamento = computed(() => relatóriosStore
  .lista.some((relatorio) => !relatorio.arquivo && !relatorio.processamento.err_msg));

function carregarRelatorios() {
  if (abaVisivel) {
    relatóriosStore.getAll({ fonte: fonte.value });
  }
}

function excluirRelatório(id) {
  alertStore.confirmAction('Deseja remover o relatório?', () => {
    relatóriosStore.delete(id);
  }, 'Remover');
}

function formatarSeEPublico(publico) {
  return publico ? 'Sim' : 'Não';
}

function redefinirIntervalo() {
  if (idDoIntervaloDeAtualizacao) {
    clearInterval(idDoIntervaloDeAtualizacao);
    idDoIntervaloDeAtualizacao = 0;
  }
}

function definirIntervalo() {
  if (abaVisivel && temAlgumRelatorioEmProcessamento.value && !idDoIntervaloDeAtualizacao) {
    idDoIntervaloDeAtualizacao = setInterval(carregarRelatorios, 5000);
  } else if (!abaVisivel) {
    redefinirIntervalo();
  }
}

function gerirVisibilidadeDaJanela() {
  abaVisivel = !document.hidden;

  definirIntervalo();
}

function iniciar() {
  relatóriosStore.$reset();
  carregarRelatorios();
}

watch(fonte, (novaFonte, antigaFonte) => {
  if (novaFonte !== antigaFonte) {
    iniciar();
  }
}, { immediate: true });

watch(temAlgumRelatorioEmProcessamento, (valorNovo, valorAnterior) => {
  if (valorNovo === valorAnterior) {
    return;
  }

  if (valorNovo) {
    definirIntervalo();
  } else {
    redefinirIntervalo();
  }
});

onMounted(() => {
  document.addEventListener('visibilitychange', gerirVisibilidadeDaJanela);
});

onBeforeRouteLeave(() => {
  document.removeEventListener('visibilitychange', gerirVisibilidadeDaJanela);
  redefinirIntervalo();
  relatóriosStore.$reset();
});
</script>

<template>
  <CabecalhoDePagina class="mb2">
    <template #acoes>
      <router-link
        v-if="temPermissãoPara('Reports.executar.')"
        :to="{ name: $route.meta.rotaNovoRelatorio }"
        class="btn big"
      >
        Novo relatório
      </router-link>
    </template>
  </CabecalhoDePagina>

  <SmaeTable
    class="mt2"
    :dados="relatóriosStore.lista"
    :colunas="[
      { chave: 'criador.nome_exibicao', label: 'Criador' },
      { chave: 'criado_em', label: 'Gerado em', formatador: localizarDataHorario },
      { chave: 'parametros_processados', label: 'Filtros Aplicados' },
      { chave: 'eh_publico', label: 'Relatório Público', formatador: formatarSeEPublico },
      { chave: 'acoes', label: 'Ações' },
    ]"
    @deletar="excluirRelatório"
  >
    <template #colunas>
      <col>
      <col class="col--dataHora">
      <col>
      <col class="col--minimum">
      <col class="col--botão-de-ação">
    </template>

    <template #celula:parametros_processados="{ linha }">
      <dl>
        <div
          v-for="(parametro) in linha.parametros_processados"
          :key="parametro.filtro"
        >
          <dt class="w700 inline">
            {{ parametro.filtro }}:
          </dt>
          <dd class="inline">
            <template v-if="!Array.isArray(parametro.valor)">
              {{ parametro.valor }}
            </template>
            <template v-else>
              {{ combinadorDeListas(parametro.valor) }}
            </template>
          </dd>
        </div>
      </dl>
    </template>

    <template #celula:acoes="{ linha }">
      <div class="flex g1">
        <button
          v-if="temPermissãoPara(['Reports.remover.'])"
          class="like-a__text"
          arial-label="excluir"
          title="excluir"
          type="button"
          @click="excluirRelatório(linha.id)"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_waste" /></svg>
        </button>

        <span
          v-if="linha.processamento.err_msg"
          :title="linha.processamento.err_msg"
        >
          <svg
            width="20"
            height="20"
          >
            <use xlink:href="#i_alert" />
          </svg>
        </span>
        <template v-else-if="!linha.arquivo">
          <LoadingComponent
            v-if="!linha.arquivo"
            title="Relatório em processamento"
          >
            <span class="sr-only">
              Relatório em processamento
            </span>
          </LoadingComponent>
        </template>
        <a
          v-else
          :href="`${baseUrl}/download/${linha.arquivo}`"
          download
          title="baixar"
        >
          <img src="@/assets/icons/baixar.svg">
        </a>
      </div>
    </template>
  </SmaeTable>
  <button
    v-if="relatóriosStore.paginação.temMais && relatóriosStore.paginação.tokenDaPróximaPágina"
    type="button"
    :disabled="relatóriosStore.loading || temAlgumRelatorioEmProcessamento"
    class="btn bgnone outline center mt2"
    @click="relatóriosStore.getAll(Object.assign(
      structuredClone($route.query),
      {
        fonte: fonte.value,
        token_proxima_pagina: relatóriosStore.paginação.tokenDaPróximaPágina
      }
    ))"
  >
    carregar mais
  </button>
</template>
