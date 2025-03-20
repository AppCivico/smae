<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import * as CardEnvelope from '@/components/cardEnvelope';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import GrandesNumerosDeMetas from '@/components/quadroDeAtividades/GrandesNumerosDeMetas.vue';
import GraficoDeSituacoesDasVariaveis from '@/components/quadroDeAtividades/GraficoDeSituacoesDasVariaveis.vue';
import FiltroDoQuadroDeAtividades from '@/components/planoSetorialProgramaMetas.componentes/FiltroDoQuadroDeAtividades.vue';
import ListaLegendas from '@/components/planoSetorialProgramaMetas.componentes/QuadroDeAtividades/ListaLegendas.vue';
import CicloVigenteFiltro from '@/components/planoSetorialProgramaMetas.componentes/QuadroDeAtividades/CicloVigenteFiltro.vue';
import { listaDeSituacoes, listaDeStatus } from '@/components/planoSetorialProgramaMetas.componentes/QuadroDeAtividades/helpers/obterDadosItems';
import CicloListaItem, { type CicloVigenteItemParams } from '@/components/planoSetorialProgramaMetas.componentes/QuadroDeAtividades/CicloListaItem.vue';
import { usePanoramaPlanoSetorialStore } from '@/stores/planoSetorial.panorama.store';
import dateToTitle from '@/helpers/dateToTitle';

const items: CicloVigenteItemParams[] = [
  {
    id: 11,
    metaId: 117,
    titulo: '001 - Atender 1.900.000 pessoas em programas de transferência de renda e/ou apoio nutricional',
    variaveis: [
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
    ],
    situacoes: [
      { item: 'analise_risco', status: 'atualizado' },
      { item: 'cronograma', status: 'atualizado' },
      { item: 'fechamento', status: 'pendente' },
      { item: 'qualificacao', status: 'atualizado' },
    ],
  },
  {
    id: 11,
    metaId: 117,
    titulo: '002 - Implantar o prontuário eletrônico em 100% das UBS do município',
    variaveis: [
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
      { label: 'A coletar atrasadas', contagem: 6 },
      { label: 'A coletar', contagem: 5 },
      { label: 'conferir', contagem: 3 },
    ],
    situacoes: [
      { item: 'analise_risco', status: 'pendente' },
      { item: 'cronograma', status: 'pendente' },
      { item: 'fechamento', status: 'pendente' },
      { item: 'qualificacao', status: 'pendente' },
      { item: 'orcamento', status: 'pendente' },
    ],
  },
];

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
    <CardEnvelope.Conteudo class="container-inline">
      <CardEnvelope.Titulo titulo="Situações das variáveis" />
      <GraficoDeSituacoesDasVariaveis
        :variaveis="variaveis.total_por_situacao"
      />
    </CardEnvelope.Conteudo>

    <CardEnvelope.Conteudo>
      <CardEnvelope.Titulo titulo="Outras variáveis do órgão não associadas ao PS/PdM" />
      <GraficoDeSituacoesDasVariaveis
        :variaveis="variaveis.nao_associadas_plano_atual"
        :cores="['#292279', '#4539ca', '#5345f3', '#8c83f7', '#c6c1fb']"
      />
    </CardEnvelope.conteudo>

    <CardEnvelope.Conteudo class="container-inline grid-full-column">
      <CardEnvelope.Titulo titulo="Metas" />
      <GrandesNumerosDeMetas
        :metas="estatisticasMetas"
      />
    </CardEnvelope.Conteudo>
  </div>

  <section class="mt4">
    <header class="flex g05">
      <h1 class="t24 w400 mb0">
        Metas
      </h1>

      <hr class="f1">
    </header>

    <article class="flex spacebetween end">
      <CicloVigenteFiltro />

      <ListaLegendas
        :legendas="{
          situacao: listaDeSituacoes,
          status: listaDeStatus,
        }"
      >
        <template #situacao>
          <h1>#situacao</h1>
        </template>

        <template #status>
          <h1>#status</h1>
        </template>
      </ListaLegendas>
    </article>

    <ul class="mt2 flex column g2">
      <CicloListaItem
        v-for="(item, itemIndex) in items"
        :id="item.id"
        :key="itemIndex"
        :meta-id="item.metaId"
        :titulo="item.titulo"
        :variaveis="item.variaveis"
        :situacoes="item.situacoes"
      />
    </ul>
  </section>
</template>
<style>
.lista-de-cartoes {
  display: grid;
  gap: 2rem;
}

@media (width >= 1000px) {
  .lista-de-cartoes {
    grid-template-columns: 1fr 1fr;
  }
}

.pagina-de-painel-estrategico body {
  background-color: #ffffffb3;
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
