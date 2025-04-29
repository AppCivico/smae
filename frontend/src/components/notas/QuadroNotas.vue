<template>
  <div class="container">
    <p class="title center">
      NOTAS
    </p>
    <div
      v-for="(item, index) in lista"
      :key="index"
      class="flex center notas"
    >
      <div class="bullet" />
      <p class="identificador">
        <router-link
          :to="{
            name: 'TransferenciasVoluntariasDetalhes',
            params: { transferenciaId: item.transferencia_id }
          }"
          class="tprimary"
        >
          {{ item.transferencia_identificador }}
        </router-link>
      </p>
      <div class="text">
        <p>{{ removerHtml(truncate(item.nota, 50)) }}</p>
        <p>
          <strong>{{ formatarData(item.data_nota).diaMesAno }}</strong>
        </p>
      </div>
    </div>

    <LoadingComponent
      v-if="chamadasPendentes.lista"
      class="mb1"
    >
      buscando notas
    </LoadingComponent>
    <div v-else-if="erro">
      Erro: {{ erro }}
    </div>
    <div
      v-else-if="!lista.length"
      class="mt1"
    >
      Nenhum resultado encontrado.
    </div>

    <button
      v-if="paginação.temMais && paginação.tokenDaPróximaPágina"
      :disabled="chamadasPendentes.lista"
      class="btn bgnone outline center mt2"
      @click="blocoStore.buscarTudoPanorama({
        ...route.query,
        token_proxima_pagina: paginação.tokenDaPróximaPágina
      })"
    >
      carregar mais
    </button>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import esferasDeTransferencia from '@/consts/esferasDeTransferencia';
import removerHtml from '@/helpers/html/removerHtmlrHtml';
import truncate from '@/helpers/texto/truncate';
import { useBlocoDeNotasStore } from '@/stores/blocoNotas.store';

const blocoStore = useBlocoDeNotasStore();
const {
  lista,
  chamadasPendentes,
  erro,
  paginação,
} = storeToRefs(blocoStore);

const route = useRoute();

function formatarData(data) {
  if (!data) return '';

  const dataObj = new Date(data);

  const diaMesAno = dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return { diaMesAno };
}

watch([
  () => route.query.esfera,
  () => route.query.partido_ids,
  () => route.query.orgaos_ids,
  () => route.query.palavra_chave,
  () => route.query.atividade,
], () => {
  const {
    partido_ids: partidoFiltro,
    orgaos_ids: orgaoFiltro,
    atividade: atividadeFiltro,
  } = route.query;

  let {
    palavra_chave: palavraChaveParaBusca,
  } = route.query;

  if (typeof palavraChaveParaBusca === 'string') {
    palavraChaveParaBusca = palavraChaveParaBusca.trim();
  }
  blocoStore.$reset();
  blocoStore.buscarTudoPanorama({
    esfera: route.query.esfera
      ? Object.keys(esferasDeTransferencia)
        .find((x) => x.toLowerCase() === route.query.esfera.toLocaleLowerCase())
      : undefined,
    partido_ids: partidoFiltro,
    orgaos_ids: orgaoFiltro,
    palavra_chave: palavraChaveParaBusca,
    atividade: atividadeFiltro,
    ipp: 15,
  });
}, { immediate: true });

blocoStore.buscarTudoPanorama({ ipp: 15 });
</script>

<style scoped lang="less">
.container {
  padding: 15px 25px;
  border-radius: 10px;
  box-shadow: 0 8px 16px 0 #1527411a;
  width: 302px;
  min-width: 302px;
  height: auto !important;
}

.title {
  text-align: center;
  color: #3b5881;
  font-weight: 700;
  font-size: 13px;
}

.notas {
  padding-top: 20px;
  padding-left: 20px;
  border-left: 1px solid #607a9f;
  justify-content: space-between;
  position: relative;
}

.bullet {
  position: absolute;
  left: -4px;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background-color: #607a9f;
  border-radius: 50%;
}

.identificador {
  border-radius: 50%;
  display: inline-block;
  line-height: 55px;
  width: 55px;
  height: 55px;
  text-align: center;
}

.notas:nth-child(3n + 1) .identificador {
  background-color: #e2eafe;
}

.notas:nth-child(3n + 2) .identificador {
  background-color: #f7f2fc;
}

.notas:nth-child(3n) .identificador {
  background-color: #fff4e9;
}

.text {
  text-align: right;
  font-size: 13px;
  margin-left: 10px;
}

.text p:first-child {
  max-width: 151px;
  max-height: 28px;
  margin-bottom: 5px;
  font-size: 11px;
  overflow: hidden;
}

p {
  margin-bottom: 0;
}
</style>
