<template>
  <div class="flex flexwrap g1 justifycenter">
    <NumeroComLegenda
      :numero="planejados"
      cor="#F2C94C"
      cor-de-fundo="#e8e8e866"
      :legenda="`Planejados para ${ano}`"
      :tamanho-do-numero="70"
      :tamanho-da-legenda="10"
    />
    <NumeroComLegenda
      :numero="concluidos"
      cor="#F2C94C"
      cor-de-fundo="#e8e8e866"
      :legenda="`Concluídos em ${ano}`"
      :tamanho-do-numero="70"
      :tamanho-da-legenda="10"
    />
  </div>
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
  }
}
</style>
