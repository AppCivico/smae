<template>
  <NumeroComLegenda
    :numero="planejados"
    cor="#F2C94C"
    :legenda="`Planejados para ${ano}`"
    :tamanho-do-numero="70"
    :tamanho-da-legenda="10"
  />
  <NumeroComLegenda
    :numero="concluidos"
    cor="#F2C94C"
    :legenda="`Concluídos em ${ano}`"
    :tamanho-do-numero="70"
    :tamanho-da-legenda="10"
  />
</template>

<script setup>
import { defineProps } from 'vue';
import NumeroComLegenda from './NumeroComLegenda.vue';

defineProps({
  planejados: {
    type: Number,
    required: true,
  },
  concluidos: {
    type: Number,
    required: true,
  },
  ano: {
    type: Number,
    required: true,
  },
});
</script>

<style scoped lang="less">
:deep{

  .card{
    max-width: max-content;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
