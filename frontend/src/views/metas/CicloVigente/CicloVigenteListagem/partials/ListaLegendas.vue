<script lang="ts" setup>
import {
  obterSituacaoIcone, listaDeSituacoes, listaDeStatus, obterStatus,
} from '../helpers/obterDadosItems';

</script>

<template>
  <div class="lista-legenda flex g2">
    <h4 class="lista-legenda__titulo">
      Legenda
    </h4>

    <div class="lista-legenda__conteudo">
      <dl class="lista-legenda__items">
        <div
          v-for="item in listaDeSituacoes"
          :key="item"
          class="legenda-item"
        >
          <dt class="legenda-item__icon">
            <svg>
              <use :xlink:href="`#${obterSituacaoIcone(item)}`" />
            </svg>
          </dt>

          <dd>{{ item }}</dd>
        </div>
      </dl>

      <dl class="lista-legenda__items mt1">
        <div
          v-for="item in listaDeStatus"
          :key="item"
          class="legenda-item"
        >
          <dt
            class="legenda-item__icon"
            :style="{ backgroundColor: obterStatus(item) }"
          />

          <dd>{{ item }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<style lang="less" scoped>
.lista-legenda {
  border: 1px solid #b8c0cc;
  padding: 10px;
  border-radius: 10px;
}
.lista-legenda__titulo {
  font-size: 12.5px;
  font-weight: 500;
  color: #333333;
}

.lista-legenda__items {
  display: flex;
  gap: 17.5px;
}

.legenda-item {
  display: inline-flex;
  white-space: wrap;
  gap: 4px;
  height: 20px;
  align-items: center;
  font-size: 10px;
}

.legenda-item__icon {
  width: 20px;
  height: 100%;
}

.legenda-item__icon svg {
  width: 100%;
  height: 100%;
}
</style>
