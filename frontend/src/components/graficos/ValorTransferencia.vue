<template>
  <div
    v-if="valor"
    class="container br20"
  >
    <strong>R$</strong> {{ dinheiro(valor, { semDecimais: true }) }}
    <p>valor das emendas</p>
  </div>
  <div
    v-else
    class="container br20"
  >
    <p>Não foram encontrados dados para os parâmetros selecionados</p>
  </div>
</template>

<script setup>
import dinheiro from '@/helpers/dinheiro';

defineProps({
  valor: {
    type: Number,
    default: null,
  },
});
</script>

<style scoped>
.container {
  background-color: #ffffff;
  opacity: 90%;
  padding: 20px;
  width: 100%;
  max-width: 450px;
  font-size: 58px;
  text-align: center;
  color: #76c893;
  font-weight: 300;
  margin: 0 auto;
  box-sizing: border-box;
}

.container p {
  color: #3b5881;
  font-size: 39px;
  font-weight: 700;
}

@media (max-width: 768px) {
  .container {
    font-size: 48px;
    padding: 15px;
  }

  .container p {
    font-size: 30px;
  }
}

@media (max-width: 480px) {
  .container {
    font-size: 38px;
    padding: 10px;
  }

  .container p {
    font-size: 25px;
  }
}
</style>
