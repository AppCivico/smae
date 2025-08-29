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
  <section class="flex g2">
    <div class="buscador-geolocalizacao__filtro">
      <BuscadorGeolocalizacaoFiltro />

      <BuscadorGeolocalizacaoListagem @selecao="ev => emit('selecao', ev)" />
    </div>

    <BuscadorGeolocalizacaoMapa class="f1" />
  </section>
</template>

<style lang="less" scoped>
.buscador-geolocalizacao__filtro {
  width: 40%;
}
</style>
