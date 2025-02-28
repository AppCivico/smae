<script setup>
import { defineProps } from 'vue';

defineProps({
  numero: {
    type: [String, Number],
    default: 0,
  },
  comoItem: {
    type: Boolean,
    default: false,
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
  <component
    :is="$props.comoItem ? 'div' : 'dl'"
    :style="{ backgroundColor: corDeFundo || 'transparent' }"
    class="card"
  >
    <dt
      :style="{ color: cor, fontSize: tamanhoDoNumero + 'px' }"
      class="number"
    >
      <slot name="numero">
        {{ String(numero).padStart(2, '0') }}
      </slot>
    </dt>
    <dd
      :style="{ fontSize: tamanhoDaLegenda + 'px' }"
      class="label"
    >
      <slot name="legenda">
        {{ legenda }}
      </slot>
    </dd>
  </component>
</template>

<style scoped>
.card {
  text-align: center;
  padding: 20px;
  border-radius: 21px;
}

.number {
  margin: 0;
  font-family: "Roboto Mono", monospace;
  letter-spacing: -0.1em;
  font-weight: 600;
  font-style: normal;
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
  width: 50%;
  border-top: 1px solid #7E858D;
  margin: -25px auto 0;
}
</style>
