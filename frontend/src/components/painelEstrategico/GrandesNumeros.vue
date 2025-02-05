<template>
  <dl class="flex flexwrap g1 justifycenter center pb2">
    <NumeroComLegenda
      como-item
      :numero="grandesNumeros.total_projetos"
      cor="#221F43"
      legenda="Total de projetos"
      :tamanho-do-numero="tamanhoDoNúmeroSecundário"
      :tamanho-da-legenda="12"
    />

    <NumeroComLegenda
      como-item
      :numero="grandesNumeros.total_orgaos"
      cor="#221F43"
      legenda="Total de órgãos"
      cor-de-fundo="#e8e8e866"
      :tamanho-do-numero="tamanhoDoNúmeroSecundário"
      :tamanho-da-legenda="12"
    />

    <NumeroComLegenda
      como-item
      :numero="grandesNumeros.total_metas"
      cor="#221F43"
      legenda="Total de metas"
      cor-de-fundo="#e8e8e866"
      :tamanho-do-numero="tamanhoDoNúmeroSecundário"
      :tamanho-da-legenda="12"
    />
  </dl>
</template>

<script setup>
import NumeroComLegenda from '@/components/painelEstrategico/NumeroComLegenda.vue';
import { defineProps } from 'vue';

defineProps({
  grandesNumeros: {
    type: Object,
    required: true,
  },
});

const tamanhoDoNúmeroPrimário = 100;
const tamanhoDoNúmeroSecundário = 80;
</script>
