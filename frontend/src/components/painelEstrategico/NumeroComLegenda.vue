<script setup>
import { defineProps } from 'vue';

defineProps({
  numero: {
    type: [String, Number],
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

<template>
  <dl
    :style="{ backgroundColor: corDeFundo || 'transparent' }"
    class="card"
  >
    <dt
      :style="{ color: cor, fontSize: tamanhoDoNumero + 'px' }"
      class="number"
    >
      {{ String(numero).padStart(2, '0') }}
    </dt>
    <dd
      :style="{ fontSize: tamanhoDaLegenda + 'px' }"
      class="label"
    >
      {{ legenda }}
    </dd>
  </dl>
</template>

<style scoped>
.card {
  text-align: center;
  padding: 20px;
  border-radius: 21px;
}

.number {
  margin: 0;
  font-weight: bold;
}

.label {
  margin: 0;
  color: #7E858D;
  text-transform: uppercase;
  position: relative;
  padding-top: 20px;
}

.label::after {
  content: '';
  display: block;
  width: 30%;
  border-top: 1px solid #7E858D;
  margin: -25px auto 0;
}
</style>
