<script setup>
import NumeroComLegenda from './NumeroComLegenda.vue';
import CardEnvelopeTitulo from '../card-envelope/CardEnvelopeTitulo.vue';
</script>
<template>
  <div class="card-shadow p2">
    <CardEnvelopeTitulo
      titulo="Projetos"
      subtitulo="Total de projetos planejados e concluídos no ano vigente."
      icone="box"
      cor="#F2C94C"
    />
    <NumeroComLegenda
      numero="9"
      cor="#F2C94C"
      legenda="PLANEJADOS PARA 2024"
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
  </div>
</template>
