<script setup lang="ts">
import { computed } from 'vue';

interface Etapa {
  id: string;
  label?: string;
  concluido: boolean;
  atual: boolean;
}

const props = defineProps<{
  etapas: Etapa[];
}>();

const etapaAtual = computed(() => {
  const index = props.etapas.findIndex((etapa) => etapa.atual);
  return index !== -1 ? index + 1 : 1;
});

const totalEtapas = computed(() => props.etapas.length);
</script>

<template>
  <div class="etapas-container">
    <div class="etapas-barras">
      <div
        v-for="etapa in etapas"
        :key="etapa.id"
        class="etapa-barra"
        :class="{
          'etapa-concluida': etapa.concluido,
          'etapa-atual': etapa.atual,
        }"
      />
    </div>
    <p class="etapas-texto t13">
      Etapa {{ etapaAtual }} / {{ totalEtapas }}
    </p>
  </div>
</template>

<style scoped lang="less">
.etapas-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.etapas-barras {
  display: flex;
  gap: 10px;
  flex: 1;
}

.etapa-barra {
  height: 8px;
  flex: 1;
  background-color: #E0E0E0;
  border-radius: 4px;
  transition: background-color 0.3s ease;

  &.etapa-concluida {
    background-color: #4CAF50;
  }

  &.etapa-atual {
    background-color: #2196F3;
  }
}

.etapas-texto {
  white-space: nowrap;
  color: #152741;
  margin: 0;
}
</style>
