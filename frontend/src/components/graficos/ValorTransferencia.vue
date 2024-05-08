<template>
  <div>
    <strong>R$</strong>{{ props.valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") }}
    <p>valor das emendas</p>
  </div>
</template>

<script setup>
const props = defineProps({
  valor: {
    type: Number || null,
    default: null,
  },
});
</script>
<style scoped>
div {
  background-color: #ffffff;
  opacity: 90%;
  border-radius: 19px;
  padding: 20px;
  max-width: 450px;
  font-size: 58px;
  text-align: center;
  color: #76c893;
  font-weight: 300;
  p {
    color: #3b5881;
    font-size: 39px;
    font-weight: 700;
  }
}
</style>
