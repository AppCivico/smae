<script lang="ts" setup>
import * as CardEnvelope from '@/components/cardEnvelope';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import GrandesNumeros from '@/components/painelEstrategico/GrandesNumeros.vue';
import FiltroDoQuadroDeAtividades from '@/components/planoSetorialProgramaMetas.componentes/FiltroDoQuadroDeAtividades.vue';
import GrandesNumerosDeMetas from '@/components/quadroDeAtividades/GrandesNumerosDeMetas.vue';
import dateToTitle from '@/helpers/dateToTitle';
import { usePanoramaPlanoSetorialStore } from '@/stores/planoSetorial.panorama.store';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useRoute } from 'vue-router';

defineOptions({
  inheritAttrs: false,
});

const route = useRoute();
const panoramaStore = usePanoramaPlanoSetorialStore(route.meta.entidadeMãe);

const {
  variaveis,
  estatisticasMetas,
  listaMetas,
  cicloAtual,
  chamadasPendentes,
  erros,
  paginacaoDeMetas,
} = storeToRefs(panoramaStore);

watch([
  () => route.query.orgao_id,
  () => route.query.equipe_id,
  () => route.query.visao_pessoal,
  () => route.query.pdm_id,
], async ([orgaoId, equipeId, visaoPessoal, pdmId]) => {
  if (!pdmId) {
    return;
  }
  panoramaStore.buscarTudo({
    pdm_id: pdmId as unknown as number,
    orgao_id: orgaoId && !Array.isArray(orgaoId)
      ? [orgaoId as unknown as number]
      : orgaoId as unknown as number[]
      || undefined,
    equipes: equipeId && !Array.isArray(equipeId)
      ? [equipeId as unknown as number]
      : equipeId as unknown as number[]
      || undefined,
    visao_pessoal: visaoPessoal as unknown as boolean,
  });
}, { immediate: true });
</script>
<template>
  <header class="mb2 cabecalho">
    <TítuloDePágina />

    <h2
      class="subtitulo"
      :aria-busy="chamadasPendentes.listaMetas"
      aria-live="assertive"
    >
      <LoadingComponent
        v-if="chamadasPendentes.listaMetas"
        class="horizontal"
      />
      <template v-else-if="cicloAtual?.data_ciclo">
        {{ dateToTitle(cicloAtual.data_ciclo) }}
      </template>
      <template v-else>
        Ciclo atual indisponível
      </template>
    </h2>
  </header>

  <FormularioQueryString v-slot="{ aplicarQueryStrings, detectarMudancas, formularioSujo }">
    <FiltroDoQuadroDeAtividades
      v-detectar-posicao-congelada="'filtro--congelado'"
      class="filtro pt1 pb1"
      :class="{
        'formulario-sujo': formularioSujo
      }"
      @enviado="aplicarQueryStrings"
      @campo-mudou="detectarMudancas"
    />
  </FormularioQueryString>

  <!-- eslint-disable -->
  <div class="debug flex flexwrap g1">
    <textarea
      readonly
      cols="30"
      rows="10"
      class="f1"
    >variaveis:{{ variaveis }}</textarea>
    <textarea
      readonly
      cols="30"
      rows="10"
      class="f1"
    >estatisticasMetas:{{ estatisticasMetas }}</textarea>
    <textarea
      readonly
      cols="30"
      rows="10"
      class="f1"
    >listaMetas:{{ listaMetas }}</textarea>
    <textarea
      readonly
      cols="30"
      rows="10"
      class="f1"
    >cicloAtual:{{ cicloAtual }}</textarea>
    <textarea
      readonly
      cols="30"
      rows="10"
      class="f1"
    >chamadasPendentes:{{ chamadasPendentes }}</textarea>
    <textarea
      readonly
      cols="30"
      rows="10"
      class="f1"
    >erros:{{ erros }}</textarea>
    <textarea
      readonly
      cols="30"
      rows="10"
      class="f1"
    >paginacaoDeMetas:{{ paginacaoDeMetas }}</textarea>
  </div>
  <!-- eslint-enable -->

  <ErrorComponent v-if="erros.variaveis">
    {{ erros.variaveis }}
  </ErrorComponent>

  <LoadingComponent v-else-if="chamadasPendentes.variaveis" />

  <div
    v-else
    class="lista-de-cartoes"
  >
    <CardEnvelope.Conteudo>
      <CardEnvelope.Titulo
        titulo="Título"
        icone="gear"
        subtitulo="subtitulo"
      />

      <GrandesNumeros :grandes-numeros="{}" />
    </CardEnvelope.conteudo>

    <CardEnvelope.Conteudo class="container-inline">
      <CardEnvelope.Titulo titulo="Metas" />
      <GrandesNumerosDeMetas
        :metas="estatisticasMetas"
      />
    </CardEnvelope.Conteudo>
  </div>
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
.filtro {
  @media (min-height: 40em) {
    background-color: @branco;

    position: sticky;
    top: 0;

    margin-right: -21px !important;
    margin-left: -21px !important;
    padding-right: 21px !important;
    padding-left: 21px !important;

    &--congelado {
      .congelado-no-topo();
    }
  }
}
</style>
