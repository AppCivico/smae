<template>
  <TituloDaPagina />

  <GraficoVariaveis
    v-if="emFoco"
    :variavel="emFoco"
  />
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store';
import GraficoVariaveis from '../../components/graficos/GraficoVariaveis/GraficoVariaveisIndex.vue';

const variaveisGlobaisStore = useVariaveisGlobaisStore();

const {
  emFoco,
} = storeToRefs(variaveisGlobaisStore);
</script>
