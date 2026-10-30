<script setup lang="ts">
import type { PainelParlamentarPorPartidoDto } from '@back/casa-civil/painel-parlamentar/entities/painel-parlamentar.entity';
import { computed } from 'vue';

import dinheiro from '@/helpers/dinheiro';

import corDoItem from './coresDoPainel';

const props = defineProps<{
  itens: PainelParlamentarPorPartidoDto[];
}>();

const TAMANHO = 218;
const ESPESSURA = 35;
const RAIO = (TAMANHO - ESPESSURA) / 2;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;
const ESPACAMENTO = 0.8;

const total = computed(() => props.itens.reduce((soma, item) => soma + item.valor, 0));

const fatias = computed(() => {
  let deslocamento = 0;

  return props.itens.map((item, indice) => {
    const comprimento = total.value
      ? (item.valor / total.value) * CIRCUNFERENCIA
      : 0;

    const fatia = {
      ...item,
      cor: corDoItem(indice, item.outros),
      dasharray: `${Math.max(comprimento - ESPACAMENTO, 0)} ${CIRCUNFERENCIA}`,
      dashoffset: -deslocamento,
    };

    deslocamento += comprimento;

    return fatia;
  });
});
</script>

<template>
  <div class="grafico-por-partido">
    <svg
      class="grafico-por-partido__rosca"
      :viewBox="`0 0 ${TAMANHO} ${TAMANHO}`"
      :width="TAMANHO"
      :height="TAMANHO"
      aria-hidden="true"
    >
      <circle
        v-for="fatia in fatias"
        :key="fatia.partido?.id ?? 'outros'"
        :cx="TAMANHO / 2"
        :cy="TAMANHO / 2"
        :r="RAIO"
        fill="none"
        :stroke="fatia.cor"
        :stroke-width="ESPESSURA"
        :stroke-dasharray="fatia.dasharray"
        :stroke-dashoffset="fatia.dashoffset"
        :transform="`rotate(-90 ${TAMANHO / 2} ${TAMANHO / 2})`"
      />
    </svg>

    <ul class="grafico-por-partido__legenda">
      <li
        v-for="fatia in fatias"
        :key="fatia.partido?.id ?? 'outros'"
        class="grafico-por-partido__item"
      >
        <strong
          class="grafico-por-partido__valor"
          :style="{ color: fatia.cor }"
        >
          {{ dinheiro(fatia.valor) }}
        </strong>
        <span
          class="grafico-por-partido__rotulo"
          :class="{ 'grafico-por-partido__rotulo--outros': fatia.outros }"
          :title="fatia.partido?.nome"
        >
          {{ fatia.rotulo }}
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="less">
.grafico-por-partido {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-top: 24px;
}

.grafico-por-partido__rosca {
  flex-shrink: 0;
  margin-right: 0;
}

.grafico-por-partido__legenda {
  display: flex;
  flex-direction: column;
  gap: 11px;
  margin: 0;
  padding: 4px 0 4px 20px;
  border-left: 0.32px solid fade(@c100, 50%);
  list-style: none;
}

.grafico-por-partido__item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.grafico-por-partido__valor {
  font-family: 'Roboto Slab', serif;
  font-size: 19.91px;
  font-weight: 600;
  line-height: 15.27px;
}

.grafico-por-partido__rotulo {
  font-size: 8.63px;
  font-weight: 600;
  line-height: 9.29px;
  color: #7e858d;
}

.grafico-por-partido__rotulo--outros {
  text-transform: uppercase;
}
</style>
