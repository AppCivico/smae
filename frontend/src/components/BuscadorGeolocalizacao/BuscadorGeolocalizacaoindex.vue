<script lang="ts" setup>
import BuscadorGeolocalizacaoMapa from './BuscadorGeolocalizacaoMapa.vue';
import BuscadorGeolocalizacaoFiltro from './BuscadorGeolocalizacaoFiltro.vue';
import BuscadorGeolocalizacaoListagem from './BuscadorGeolocalizacaoListagem.vue';

</script>

<template>
  <section class="flex g2">
    <div class="buscador-geolocalizacao__filtro">
      <BuscadorGeolocalizacaoFiltro />

      <BuscadorGeolocalizacaoListagem />
    </div>

    <BuscadorGeolocalizacaoMapa class="f1" />
  </section>
</template>

<style lang="less" scoped>
.buscador-geolocalizacao__filtro {
  width: 40%;
}
</style>
