<script setup>
import { computed } from 'vue';

const props = defineProps({
  tipo: {
    type: String,
    default: 'neutro',
    validator(valor) {
      return [
        'neutro',
        'positivo',
        'negativo',
      ].indexOf(valor) > -1;
    },
  },
  mensagem: {
    type: String,
    default: '',
  },
  título: {
    type: String,
    default: '',
  },
});

const ícone = computed(() => {
  const { tipo } = props;

  switch (tipo) {
    case 'positivo':
      return {
        color: '#f7c234',
        href: '#i_celebrate',
      };
    case 'negativo':
      return {
        color: '#ee3b2b',
        href: '#i_report',
      };
    default:
      return null;
  }
});
</script>
<template>
  <div
    class="celebrate flex column center tc600 w700 mb1"
  >
    <svg
      v-if="ícone"
      width="107"
      height="107"
      :color="ícone.color"
    ><use :xlink:href="ícone.href" /></svg>
    <p
      v-if="título"
      class="t20 mb0 mt1"
    >
      {{ título }}
    </p>
    <p
      v-if="mensagem"
      class="mb0"
    >
      {{ mensagem }}
    </p>
  </div>
</template>
