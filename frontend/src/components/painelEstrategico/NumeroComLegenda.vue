<template>
  <div
    :style="{ backgroundColor: corDeFundo || 'transparent' }"
    class="card"
  >
    <h1
      :style="{ color: cor, fontSize: tamanhoDoNumero + 'px' }"
      class="number"
    >
      {{ numero }}
    </h1>
    <hr class="line">
    <p
      :style="{ fontSize: tamanhoDaLegenda + 'px' }"
      class="label"
    >
      {{ legenda }}
    </p>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  numero: {
    type: [Number, String],
    required: true,
  },
  cor: {
    type: String,
    required: true,
  },
  corDeFundo: {
    type: String,
    default: null,
  },
  legenda: {
    type: String,
    required: true,
  },
  tamanhoDoNumero: {
    type: Number,
    required: true,
  },
  tamanhoDaLegenda: {
    type: Number,
    required: true,
  },
});
</script>

<style scoped>
.card {
  text-align: center;
  padding: 10px;
  border-radius: 20px;
}

.number {
  margin: 0;
  font-weight: bold;
}

.line {
  width: 20%;
  border: none;
  border-top: 1px solid #7E858D;
  margin: 10px auto;
}

.label {
  margin: 0;
  color: #7E858D;
  text-transform: uppercase;
}
</style>
