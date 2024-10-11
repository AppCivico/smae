<template>
  <CardEnvelope.Conteudo>
    <CardEnvelope.Titulo
      titulo="Projetos"
      subtitulo="Total de projetos planejados e concluídos no ano vigente."
      icone="box"
      cor="#F2C94C"
    />

    <NumeroComLegenda
      numero="9"
      cor="#F2C94C"
      legenda="Planejados para 2024"
      :tamanho-do-numero="70"
      :tamanho-da-legenda="10"
    />
    <NumeroComLegenda
      numero="36"
      cor="#F2C94C"
      legenda="CONCLUÍDOS EM 2024"
      :tamanho-do-numero="70"
      :tamanho-da-legenda="10"
    />
  </CardEnvelope.Conteudo>
</template>

<script setup>
import NumeroComLegenda from './NumeroComLegenda.vue';
import * as CardEnvelope from '../cardEnvelope/index.ts';
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
