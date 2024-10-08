<template>
  <div class="card-shadow">
    <NumeroComLegenda
      :numero="40"
      cor="#F2C94C"
      legenda="PLANEJADOS PARA 2024"
      :tamanho-do-numero="70"
      :tamanho-da-legenda="10"
    />
    <NumeroComLegenda
      :numero="36"
      cor="#F2C94C"
      legenda="CONCLUÍDOS EM 2024"
      :tamanho-do-numero="70"
      :tamanho-da-legenda="10"
    />
  </div>
</template>

<script setup>
import NumeroComLegenda from './NumeroComLegenda.vue';

</script>

<style scoped>
div{
  max-width: 241px;
}
</style>
