<template>
  <div>
    <Cartão class="total-projetos">
      <NúmeroComLegenda
        :numero="40"
        cor="#F2C94C"
        legenda="PLANEJADOS PARA 2024"
        :tamanho-do-numero="70"
        :tamanho-da-legenda="10"
      />
      <NúmeroComLegenda
        :numero="36"
        cor="#F2C94C"
        legenda="CONCLUÍDOS EM 2024"
        :tamanho-do-numero="70"
        :tamanho-da-legenda="10"
      />
    </Cartão>
  </div>
</template>

<script setup>
import NúmeroComLegenda from './NúmeroComLegenda.vue';
import Cartão from '../ Cartão.vue';

</script>

<style scoped>
.total-projetos{
  max-width: 241px;
}
</style>
