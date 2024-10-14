<template>
  <div class="flex flexwrap g2 justifycenter center pb2">
    <NumeroComLegenda
      :numero="grandesNumeros.total_projetos"
      cor="#221F43"
      legenda="Total de projetos"
      :tamanho-do-numero="tamanhoDoNúmeroPrimário"
      :tamanho-da-legenda="12"
    />

    <NumeroComLegenda
      :numero="grandesNumeros.total_orgaos"
      cor="#221F43"
      legenda="Total de órgãos"
      cor-de-fundo="#e8e8e866"
      :tamanho-do-numero="tamanhoDoNúmeroSecundário"
      :tamanho-da-legenda="12"
    />

    <NumeroComLegenda
      :numero="grandesNumeros.total_metas"
      cor="#221F43"
      legenda="Total de metas"
      cor-de-fundo="#e8e8e866"
      :tamanho-do-numero="tamanhoDoNúmeroSecundário"
      :tamanho-da-legenda="12"
    />
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import NumeroComLegenda from '@/components/painelEstrategico/NumeroComLegenda.vue';

defineProps({
  grandesNumeros: {
    type: Object,
    required: true,
  },
});

const tamanhoDoNúmeroPrimário = 100;
const tamanhoDoNúmeroSecundário = 80;
</script>
