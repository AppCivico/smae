<script lang="ts" setup>

import { storeToRefs } from 'pinia';
import FiltroParaPagina from '@/components/FiltroParaPagina.vue';

import { FiltroEndereco as schema } from '@/consts/formSchemas';
import { useGeolocalizadorStore } from '@/stores/geolocalizador.store';

const geolocalizadorStore = useGeolocalizadorStore();
const { chamadasPendentes } = storeToRefs(geolocalizadorStore);

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
    :carregando="chamadasPendentes.buscandoEndereco"
  />
</template>
