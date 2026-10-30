<script setup lang="ts">
import type { PainelParlamentarPorSecretariaDto } from '@back/casa-civil/painel-parlamentar/entities/painel-parlamentar.entity';
import { computed } from 'vue';

import dinheiro from '@/helpers/dinheiro';

import corDoItem from './coresDoPainel';

const props = defineProps<{
  itens: PainelParlamentarPorSecretariaDto[];
}>();

const LARGURA_MAXIMA = 240;

const maiorValor = computed(() => Math.max(...props.itens.map((item) => item.valor), 0));

const barras = computed(() => props.itens.map((item, indice) => ({
  ...item,
  cor: corDoItem(indice, item.outros),
  largura: maiorValor.value
    ? `${(item.valor / maiorValor.value) * LARGURA_MAXIMA}px`
    : '0',
})));
</script>

<template>
  <ul class="grafico-por-secretaria">
    <li
      v-for="barra in barras"
      :key="barra.orgao?.id ?? 'outros'"
      class="grafico-por-secretaria__item"
    >
      <span class="grafico-por-secretaria__trilho">
        <span
          class="grafico-por-secretaria__barra"
          :style="{ width: barra.largura, backgroundColor: barra.cor }"
        />
      </span>

      <span class="grafico-por-secretaria__legenda">
        <strong
          class="grafico-por-secretaria__valor"
          :style="{ color: barra.cor }"
        >
          {{ dinheiro(barra.valor) }}
        </strong>
        <span
          class="grafico-por-secretaria__rotulo"
          :title="barra.orgao?.descricao"
        >
          {{ barra.rotulo }}
        </span>
      </span>
    </li>
  </ul>
</template>

<style scoped lang="less">
.grafico-por-secretaria {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin: 0;
  padding: 60px 0 20px;
  list-style: none;

  &::before {
    content: '';
    position: absolute;
    top: 45px;
    bottom: 0;
    left: 257px;
    border-left: 0.52px solid fade(@c100, 50%);
  }
}

.grafico-por-secretaria__item {
  display: flex;
  align-items: center;
  gap: 42px;
}

.grafico-por-secretaria__trilho {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  width: 240px;
}

.grafico-por-secretaria__barra {
  min-width: 36px;
  height: 36px;
  border-radius: 18px 0 0 18px;
}

.grafico-por-secretaria__legenda {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.grafico-por-secretaria__valor {
  font-family: 'Roboto Slab', serif;
  font-size: 31.34px;
  font-weight: 600;
  line-height: 24px;
}

.grafico-por-secretaria__rotulo {
  overflow: hidden;
  font-size: 13.58px;
  font-weight: 600;
  line-height: 15px;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  color: #7e858d;
}
</style>
