<script lang="ts" setup>

import FiltroParaPagina from '@/components/FiltroParaPagina.vue';

import { FiltroEndereco as schema } from '@/consts/formSchemas';

const camposDeFiltro = [{
  campos: {
    endereco: {
      tipo: 'text',
      placeholder: 'Termo de busca',
    },
  },
}];

</script>

<template>
  <FiltroParaPagina
    class="mb2"
    :formulario="camposDeFiltro"
    :schema="schema"
  />
</template>
