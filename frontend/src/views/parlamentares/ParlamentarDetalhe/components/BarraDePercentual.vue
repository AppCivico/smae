<script setup lang="ts">
import { computed } from 'vue';

import dinheiro from '@/helpers/dinheiro';

const props = defineProps<{
  percentual: number;
  rotulo?: string;
}>();

const largura = computed(() => `${Math.min(Math.max(props.percentual, 0), 100)}%`);
</script>

<template>
  <div class="barra-de-percentual">
    <div class="barra-de-percentual__trilho">
      <div
        class="barra-de-percentual__preenchimento"
        :style="{ width: largura }"
      />

      <span
        v-if="rotulo"
        class="barra-de-percentual__rotulo"
      >
        {{ rotulo }}
      </span>
    </div>

    <strong class="barra-de-percentual__valor">
      {{ dinheiro(percentual, { semDecimais: true }) }}%
    </strong>
  </div>
</template>

<style scoped lang="less">
.barra-de-percentual {
  display: flex;
  align-items: center;
  gap: 3px;
}

.barra-de-percentual__trilho {
  position: relative;
  flex-grow: 1;
  height: 34px;
  border-radius: 17px 0 0 17px;
  background-color: @c300;
}

.barra-de-percentual__preenchimento {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  min-width: 34px;
  border-radius: 17px 0 0 17px;
  background-color: @c500;
}

.barra-de-percentual__rotulo {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  font-size: 10.85px;
  font-weight: 600;
  line-height: 1;
  color: @c500;
}

.barra-de-percentual__valor {
  font-family: 'Roboto Slab', serif;
  font-size: 39.5px;
  font-weight: 600;
  line-height: 1.3;
  color: @c500;
}
</style>
