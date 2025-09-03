<script lang="ts" setup>
import BuscadorGeolocalizacao from '@/components/BuscadorGeolocalizacao/BuscadorGeolocalizacaoIndex.vue';
import { useGeolocalizadorStore, PontoEndereco } from '@/stores/geolocalizador.store';

const geolocalizadorStore = useGeolocalizadorStore();

async function buscarProximidade(endereco: PontoEndereco) {
  if (
    !endereco
    || endereco.camadas.length === 0
  ) {
    console.error('Endereço não encontrado', endereco);
    return;
  }

  const [camada] = endereco.camadas;

  if (
    !endereco.endereco.geometry.coordinates[0]
    || !endereco.endereco.geometry.coordinates[1]
  ) {
    console.error('Coordenadas não encontradas', endereco.endereco.geometry);
    return;
  }

  const [lon, lat] = endereco.endereco.geometry.coordinates;

  await geolocalizadorStore.buscaProximidades({
    geo_camada_codigo: camada.codigo,
    lat,
    lon,
  });
}

</script>

<template>
  <BuscadorGeolocalizacao @selecao="buscarProximidade" />
</template>
