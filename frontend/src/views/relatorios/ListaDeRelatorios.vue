<script setup>
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { localizarDataHorario } from '@/helpers/dateToDate';
import {
  onMounted,
  onUnmounted,
  computed,
  watch,
  watchEffect,
} from 'vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import combinadorDeListas from '@/helpers/combinadorDeListas';

const baseUrl = `${import.meta.env.VITE_API_URL}`;
const { temPermissãoPara } = storeToRefs(useAuthStore());
const relatóriosStore = useRelatoriosStore();
const route = useRoute();
const alertStore = useAlertStore();

let intervaloDeAtualizacao = null;
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

function handleVisibilityChange() {
  abaVisivel = !document.hidden;

  if (abaVisivel && temAlgumRelatorioEmProcessamento.value && !intervaloDeAtualizacao) {
    intervaloDeAtualizacao = setInterval(carregarRelatorios, 5000);
  } else if (!abaVisivel && intervaloDeAtualizacao) {
    clearInterval(intervaloDeAtualizacao);
    intervaloDeAtualizacao = null;
  }
}

watchEffect(() => {
  clearInterval(intervaloDeAtualizacao);
  intervaloDeAtualizacao = null;

  if (abaVisivel && temAlgumRelatorioEmProcessamento.value) {
    if (!intervaloDeAtualizacao) {
      intervaloDeAtualizacao = setInterval(carregarRelatorios, 5000);
    }
  }
});

function iniciar() {
  relatóriosStore.$reset();
  carregarRelatorios();
}

watch(fonte, (novaFonte, antigaFonte) => {
  if (novaFonte !== antigaFonte) {
    iniciar();
  }
}, { immediate: true });

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  if (intervaloDeAtualizacao) {
    clearInterval(intervaloDeAtualizacao);
  }
});
</script>

<template>
  <header class="flex spacebetween center mb2">
    <TítuloDePágina />
    <router-link
      v-if="temPermissãoPara('Reports.executar.')"
      :to="{ name: $route.meta.rotaNovoRelatorio }"
      class="btn big ml2"
    >
      Novo relatório
    </router-link>
  </header>
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
    <template #celula:parametros_processados="{ linha }">
      <dl>
        <template
          v-for="(parametro) in linha.parametros_processados"
          :key="parametro.filtro"
        >
          <div>
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
        </template>
      </dl>
    </template>
    <template #celula:acoes="{ linha }">
      <div class="flex g1">
        <button
          v-if="temPermissãoPara(['Reports.remover.'])"
          class="like-a__text"
          arial-label="excluir"
          title="excluir"
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
    :disabled="relatóriosStore.loading || temAlgumRelatorioEmProcessamento"
    class="btn bgnone outline center mt2"
    @click="relatóriosStore.getAll({
      ...$route.query,
      fonte: fonte.value,
      token_proxima_pagina: relatóriosStore.paginação.tokenDaPróximaPágina
    })"
  >
    carregar mais
  </button>
</template>
