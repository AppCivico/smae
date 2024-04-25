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
        <p v-html="item.nota" />
        <p>
          <strong>{{ formatarData(item.data_nota).diaMesAno }}</strong>
        </p>
      </div>
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
import { useBlocoDeNotasStore } from '@/stores/blocoNotas.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const blocoStore = useBlocoDeNotasStore();
const {
  lista,
  chamadasPendentes,
  paginação,
} = storeToRefs(blocoStore);

const route = useRoute();
blocoStore.buscarTudoPanorama();

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
  overflow:hidden;
  margin-bottom: 5px;
  font-size: 11px;
}

p {
  margin-bottom: 0;
}
</style>
