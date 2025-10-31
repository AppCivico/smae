<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import MapaExibir from '@/components/geo/MapaExibir.vue';
import { useGeolocalizadorStore } from '@/stores/geolocalizador.store';

const geolocalizadorStore = useGeolocalizadorStore();

export type GeoFeature = {
  bbox: [number, number, number, number];
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    cep: string;
    rua: string;
    pais: string;
    bairro: string;
    cidade: string;
    estado: string;
    numero: string;
    rotulo: string;
    osm_type: string;
    codigo_pais: string;
    string_endereco: string;
    cor_do_marcador: string;
    camposComplementares: Record<string, unknown>
  };
  geometry_name: null;
};

type Props = {
  localizacoes: GeoFeature[]
};

withDefaults(defineProps<Props>(), {
  localizacoes: () => [] as GeoFeature[],
});

const { selecionado } = storeToRefs(geolocalizadorStore);
</script>

<template>
  <MapaExibir
    :geo-json="$props.localizacoes ?? undefined"
    :camadas="selecionado?.camadas ?? undefined"
    :opções-do-polígono="{
      fill: true,
      opacity: 0.5,
    }"
    zoom="16"
  >
    <template #painel-flutuante="slotProps">
      <slot
        name="painel-flutuante"
        v-bind="slotProps"
      />
    </template>
  </MapaExibir>
</template>
