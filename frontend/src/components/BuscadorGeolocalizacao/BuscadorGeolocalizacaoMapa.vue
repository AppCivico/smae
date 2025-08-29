<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import MapaExibir from '@/components/geo/MapaExibir.vue';
import { useGeolocalizadorStore } from '@/stores/geolocalizador.store';

const geolocalizadorStore = useGeolocalizadorStore();

const { selecionado } = storeToRefs(geolocalizadorStore);

</script>

<template>
  <MapaExibir
    :key="selecionado"
    :geo-json="selecionado.enderecos || undefined"
    :camadas="selecionado.camadas || undefined"
    class="mb1"
    :opções-do-polígono="{
      fill: true,
      opacity: 0.5,
    }"
    zoom="16"
  />
</template>
