<template>
  <div class="container">
    <p class="title center">
      NOTAS
    </p>
    <div
      v-for="(item, index) in listaPanorama"
      :key="index"
      class="flex center notas"
    >
      <div class="bullet" />
      <p class="identificador">
        {{ item.transferencia_identificador }}
      </p>
      <div class="text">
        <p>{{ item.nota }}</p>
        <p>
          <strong>{{ item.data_nota }}</strong>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useBlocoDeNotasStore } from '@/stores/blocoNotas.store';
import { storeToRefs } from 'pinia';

const blocoStore = useBlocoDeNotasStore();
const {
  erro,
  chamadasPendentes,
  listaPanorama,
} = storeToRefs(blocoStore);

blocoStore.buscarTudoPanorama();
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
}

p {
  margin-bottom: 0;
}
</style>
