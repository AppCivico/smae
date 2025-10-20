<script lang="ts" setup>
import { PontoEndereco } from '@/stores/geolocalizador.store';
import BuscadorGeolocalizacaoMapa, { type GeoFeature } from './BuscadorGeolocalizacaoMapa.vue';
import BuscadorGeolocalizacaoFiltro from './BuscadorGeolocalizacaoFiltro.vue';
import BuscadorGeolocalizacaoListagem from './BuscadorGeolocalizacaoListagem.vue';

type Props = {
  localizacoes: GeoFeature[]
};

type Emits = {
  (event: 'selecao', endereco: PontoEndereco): void
};

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

</script>

<template>
  <div class="flex g2 flexwrap">
    <div class="f1 fb40">
      <BuscadorGeolocalizacaoFiltro />

      <BuscadorGeolocalizacaoListagem @selecao="ev => emit('selecao', ev)" />
    </div>

    <BuscadorGeolocalizacaoMapa
      :localizacoes="props.localizacoes"
      class="f1 fb50"
    />
  </div>
</template>
