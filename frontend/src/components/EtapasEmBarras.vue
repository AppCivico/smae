<script setup lang="ts">
import { computed } from 'vue';

interface Etapa {
  id: string;
  label?: string;
  concluido: boolean;
}

const props = defineProps<{
  etapas: Etapa[];
}>();

const etapasConcluidas = computed(() => props.etapas.filter((etapa) => etapa.concluido).length);

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
        }"
      />
    </div>
    <p class="etapas-texto t13">
      Etapas {{ etapasConcluidas }} / {{ totalEtapas }}
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
  transition: background-color 0.3s ease;

  &.etapa-concluida {
    background-color: #607A9F;
  }
}

.etapas-texto {
  white-space: nowrap;
  color: #152741;
  margin: 0;
}
</style>
