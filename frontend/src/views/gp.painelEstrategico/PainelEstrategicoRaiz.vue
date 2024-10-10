<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import * as CardEnvelope from '@/components/cardEnvelope';
import Dashboard from '@/components/DashboardLayout.vue';
import TotalDeProjetos from '@/components/painelEstrategico/TotalDeProjetos.vue';
import { usePainelEstrategicoStore } from '@/stores/painelEstrategico.store';

const route = useRoute();

const painelEstrategicoStore = usePainelEstrategicoStore(route.meta.entidadeMãe as string);

const {
  chamadasPendentes,
  erros,
} = storeToRefs(painelEstrategicoStore);

painelEstrategicoStore.buscarDados({
  portifolio_id: [
    1,
    2,
    3,
  ],
  orgao_responsavel_id: [
    1,
    2,
    3,
  ],
  projeto_id: [
    1,
    2,
    3,
  ],
});
</script>
<template>
  <Dashboard>
    <header class="flex spacebetween center mb2">
      <TítuloDePágina />
      <hr class="ml2 f1">
    </header>

    <div class="flex flexwrap g2">
      <pre class="f1 fb15em debug">anosMapaCalorConcluidos:
{{ painelEstrategicoStore.anosMapaCalorConcluidos }}</pre>
      <pre class="f1 fb15em debug">anosMapaCalorPlanejados:
      {{ painelEstrategicoStore.anosMapaCalorPlanejados }}</pre>
      <pre class="f1 fb15em debug">grandesNumeros:
      {{ painelEstrategicoStore.grandesNumeros }}</pre>
      <pre class="f1 fb15em debug">projetoEtapas:
      {{ painelEstrategicoStore.projetoEtapas }}</pre>
      <pre class="f1 fb15em debug">projetoOrgaoResponsavel:
      {{ painelEstrategicoStore.projetoOrgaoResponsavel }}</pre>
      <pre class="f1 fb15em debug">projetoStatus:
      {{ painelEstrategicoStore.projetoStatus }}</pre>
      <pre class="f1 fb15em debug">projetosConcluidosAno:
      {{ painelEstrategicoStore.projetosConcluidosAno }}</pre>
      <pre class="f1 fb15em debug">projetosConcluidosMes:
      {{ painelEstrategicoStore.projetosConcluidosMes }}</pre>
      <pre class="f1 fb15em debug">projetosPlanejadosAno:
      {{ painelEstrategicoStore.projetosPlanejadosAno }}</pre>
      <pre class="f1 fb15em debug">projetosPlanejadosMes:
      {{ painelEstrategicoStore.projetosPlanejadosMes }}</pre>
    </div>

    <ErrorComponent v-if="erros.dados" />

    <LoadingComponent v-if="chamadasPendentes.dados" />

    <div
      v-else
      class="lista-de-cartoes"
    >
      <TotalDeProjetos />

      <div style="width: 300px">
        <CardEnvelope.default>
          <CardEnvelope.Conteudo>
            <template
              #default="{ visivel }"
            >
              -Visivel: {{ visivel }}-
              <CardEnvelope.Titulo
                titulo=" Icone Prop"
                icone="graf"
                subtitulo="
                  Órgãos com os números mais expressivos de projetos.
                  Demais órgãos apresentados em Outros.
                "
              />

              <h1>Conteudo 1</h1>
              <h1>Conteudo 1</h1>
              <h1>Conteudo 1</h1>
            </template>
          </Cardenvelope.conteudo>

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

            <h1>Conteudo 2</h1>
            <h1>Conteudo 2</h1>
            <h1>Conteudo 2</h1>
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

            <h1>Conteudo 3</h1>
            <h1>Conteudo 3</h1>
            <h1>Conteudo 3</h1>
          </CardEnvelope.Conteudo>
        </CardEnvelope.default>
      </div>
    </div>

    <h1>Carossel</h1>
  </Dashboard>
</template>

<style lang="less">
.pagina-de-painel-estrategico {
  background-image: url("@{u}painel-estrategico/mapa-cinza.png");
  background-size: cover;
  background-attachment: fixed;
}

.pagina-de-painel-estrategico body {
  background-color: rgba(255, 255, 255, 0.7);
}
</style>
<style lang="less" scoped>
.lista-de-cartoes {
  display: grid;
  gap: 2rem 4rem;

  @media screen and (min-width: 55em) {
    grid-template-columns: 3fr 1fr;
  }

  @media screen and (min-width: 75em) {
    grid-template-columns: 3fr 1fr 2fr;
  }
}
</style>
