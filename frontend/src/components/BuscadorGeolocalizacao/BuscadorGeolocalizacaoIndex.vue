<script lang="ts" setup>
import { PontoEndereco } from '@/stores/geolocalizador.store';
import BuscadorGeolocalizacaoMapa from './BuscadorGeolocalizacaoMapa.vue';
import BuscadorGeolocalizacaoFiltro from './BuscadorGeolocalizacaoFiltro.vue';
import BuscadorGeolocalizacaoListagem from './BuscadorGeolocalizacaoListagem.vue';

type Emits = {
  (event: 'selecao', endereco: PontoEndereco): void
};

const emit = defineEmits<Emits>();

</script>

<template>
  <div class="flex g2 flexwrap">
    <div class="f1 fb40">
      <BuscadorGeolocalizacaoFiltro />

      <BuscadorGeolocalizacaoListagem @selecao="ev => emit('selecao', ev)" />
    </div>

    <BuscadorGeolocalizacaoMapa class="f1 fb50" />
  </div>
</template>
