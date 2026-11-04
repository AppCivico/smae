<script setup lang="ts">
import { computed } from 'vue';

import dinheiro from '@/helpers/dinheiro';

const props = defineProps<{
  percentual: number;
  rotulo?: string;
}>();

const percentualLimitado = computed(() => Math.min(Math.max(props.percentual, 0), 100));

const largura = computed(() => `${percentualLimitado.value}%`);

const percentualFormatado = computed(() => `${dinheiro(props.percentual, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})}%`);

const textoDoValor = computed(() => (props.rotulo
  ? `${percentualFormatado.value} (${props.rotulo})`
  : percentualFormatado.value));
</script>

<template>
  <div
    class="barra-de-percentual"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="percentualLimitado"
    :aria-valuetext="textoDoValor"
  >
    <span class="barra-de-percentual__trilho">
      <span
        v-if="percentualLimitado > 0"
        data-test="preenchimento"
        class="barra-de-percentual__preenchimento"
        :style="{ width: largura }"
      />

      <span
        v-if="rotulo"
        class="barra-de-percentual__rotulo"
      >
        {{ rotulo }}
      </span>
    </span>

    <strong class="barra-de-percentual__valor">
      {{ percentualFormatado }}
    </strong>
  </div>
</template>

<style scoped lang="less">
.barra-de-percentual {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  height: auto;
  overflow: visible;

  &::before,
  &::after {
    content: none;
  }
}

.barra-de-percentual__trilho {
  position: relative;
  flex-grow: 1;
  height: 2.4rem;
  border-radius: 1.2rem 0 0 1.2rem;
  background-color: @c300;
}

.barra-de-percentual__preenchimento {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  min-width: 2.4rem;
  border-radius: 1.2rem 0 0 1.2rem;
  background-color: @c500;
}

.barra-de-percentual__rotulo {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.7rem;
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1;
  color: @c500;
}

.barra-de-percentual__valor {
  font-family: 'Roboto Slab', serif;
  font-size: 2.8rem;
  font-weight: 600;
  line-height: 1.3;
  color: @c500;
}
</style>
