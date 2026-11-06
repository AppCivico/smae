<script setup lang="ts">
import type { PainelParlamentarPorSecretariaDto } from '@back/casa-civil/painel-parlamentar/entities/painel-parlamentar.entity';
import { computed } from 'vue';

import dinheiro from '@/helpers/dinheiro';

import corDoItem from './coresDoPainel';

const props = defineProps<{
  itens: PainelParlamentarPorSecretariaDto[];
}>();

const maiorValor = computed(() => Math.max(...props.itens.map((item) => item.valor), 0));

const barras = computed(() => props.itens.map((item, indice) => ({
  ...item,
  cor: corDoItem(indice, item.outros),
  largura: maiorValor.value
    ? `${(item.valor / maiorValor.value) * 100}%`
    : '0',
})));
</script>

<template>
  <dl class="grafico-por-secretaria">
    <div
      v-for="barra in barras"
      :key="barra.orgao?.id ?? 'outros'"
      class="grafico-por-secretaria__item"
      :style="{ '--largura': barra.largura, '--cor': barra.cor }"
    >
      <dt
        class="grafico-por-secretaria__rotulo"
        :title="barra.orgao?.descricao"
      >
        {{ barra.rotulo }}
      </dt>
      <dd class="grafico-por-secretaria__valor">
        {{ dinheiro(barra.valor) }}
      </dd>
    </div>
  </dl>
</template>

<style scoped lang="less">
.grafico-por-secretaria {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  margin: 0;
  padding: 4.3rem 0 1.4rem;

  &::before {
    content: '';
    position: absolute;
    top: 3.2rem;
    bottom: 0;
    left: 18.4rem;
    border-left: 0.1rem solid fade(@c100, 50%);
  }
}

.grafico-por-secretaria__item {
  display: grid;
  grid-template-columns: 17.1rem minmax(0, 1fr);
  grid-template-areas:
    'barra valor'
    'barra rotulo';
  align-items: center;
  gap: 0.4rem 3rem;

  &::before {
    content: '';
    grid-area: barra;
    justify-self: end;
    width: var(--largura);
    min-width: 2.6rem;
    height: 2.6rem;
    border-radius: 1.3rem 0 0 1.3rem;
    background-color: var(--cor);
  }
}

.grafico-por-secretaria__valor {
  grid-area: valor;
  color: var(--cor);
  font-family: 'Roboto Slab', serif;
  font-size: 2.2rem;
  font-weight: 600;
  line-height: 1.7rem;
}

.grafico-por-secretaria__rotulo {
  grid-area: rotulo;
  overflow: hidden;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.1rem;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  color: #7e858d;
}

@container (max-width: 30rem) {
  .grafico-por-secretaria {
    padding-top: 1.7rem;

    &::before {
      content: none;
    }
  }

  .grafico-por-secretaria__item {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'valor'
      'rotulo'
      'barra';

    &::before {
      justify-self: start;
      border-radius: 0 1.3rem 1.3rem 0;
    }
  }
}
</style>
