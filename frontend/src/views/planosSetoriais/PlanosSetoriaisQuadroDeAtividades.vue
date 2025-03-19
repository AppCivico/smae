<script lang="ts" setup>
import * as CardEnvelope from '@/components/cardEnvelope';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import GrandesNumeros from '@/components/painelEstrategico/GrandesNumeros.vue';
import FiltroDoQuadroDeAtividades from '@/components/planoSetorialProgramaMetas.componentes/FiltroDoQuadroDeAtividades.vue';
import GrandesNumerosDeMetas from '@/components/quadroDeAtividades/GrandesNumerosDeMetas.vue';
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
  </header>

  <FormularioQueryString v-slot="{ aplicarQueryStrings, detectarMudancas, formularioSujo }">
    <FiltroDoQuadroDeAtividades
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
<style lang="less" scoped></style>
