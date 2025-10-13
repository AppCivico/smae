<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import MapaExibir from '@/components/geo/MapaExibir.vue';
import { useGeolocalizadorStore } from '@/stores/geolocalizador.store';

const geolocalizadorStore = useGeolocalizadorStore();

type Props = {
  camposComplementares?: string[]
};

const props = defineProps<Props>();

const { selecionado, proximidadeFormatada } = storeToRefs(geolocalizadorStore);

const localizacoes = computed(() => proximidadeFormatada.value.map((i) => {
  const dados = i.localizacoes[0].geom_geojson;
  if (!dados.properties) {
    dados.properties = {};
  }

  dados.properties.camposComplementares = {};

  props.camposComplementares?.forEach((campo) => {
    if (i[campo] !== undefined) {
      dados.properties.camposComplementares[campo] = i[campo];
    }
  });

  return dados;
}));

</script>

<template>
  <MapaExibir
    :key="selecionado"
    :geo-json="localizacoes ?? undefined"
    :camadas="selecionado?.camadas ?? undefined"
    class="mb1"
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
