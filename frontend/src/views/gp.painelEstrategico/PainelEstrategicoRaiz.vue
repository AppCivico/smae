<script lang="ts" setup>
import Dashboard from '@/components/DashboardLayout.vue';
import TotalDeProjetos from '@/components/painelEstrategico/TotalDeProjetos.vue';

import * as CardEnvelope from '@/components/card-envelope';

</script>
<template>
  <Dashboard>
    <header class="flex spacebetween center mb2">
      <TítuloDePágina />
      <hr class="ml2 f1">
    </header>

    <div class="lista-de-cartoes">
      <TotalDeProjetos />
    </div>

    <h1>Carossel</h1>

    <CardEnvelope.default>
      <CardEnvelope.Conteudo>
        <CardEnvelope.Titulo
          titulo="Icone Prop"
          icone="graf"
        />
      </CardEnvelope.Conteudo>

      <CardEnvelope.Conteudo>
        <CardEnvelope.Titulo>
          <strong>Icone Slot</strong>

          <template #icone>
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </template>
        </CardEnvelope.Titulo>
      </CardEnvelope.Conteudo>
    </CardEnvelope.default>

    <h1>Card</h1>

    <CardEnvelope.default>
      <CardEnvelope.Conteudo>
        <CardEnvelope.Titulo titulo="Sem icone" />
      </CardEnvelope.Conteudo>
    </CardEnvelope.default>
  </Dashboard>
</template>
<style lang="less">
.pagina-de-painel-estrategico {
  background-image: url("@{u}painel-estrategico/mapa-cinza.png");
  background-size: cover;
}

.pagina-de-painel-estrategico body {
  background-color: rgba(255, 255, 255, 0.7);
}
</style>
<style lang="less" scoped>
.lista-de-cartoes {
  display: grid;
  gap: 2rem 4rem;
}
</style>
