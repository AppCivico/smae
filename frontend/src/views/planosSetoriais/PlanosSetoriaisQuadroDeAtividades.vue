<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import * as CardEnvelope from '@/components/cardEnvelope';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import GrandesNumerosDeMetas from '@/components/quadroDeAtividades/GrandesNumerosDeMetas.vue';
import GraficoDeSituacoesDasVariaveis from '@/components/quadroDeAtividades/GraficoDeSituacoesDasVariaveis.vue';
import FiltroDoQuadroDeAtividades from '@/components/planoSetorialProgramaMetas.componentes/FiltroDoQuadroDeAtividades.vue';
import ListaLegendas from '@/components/ListaLegendas.vue';
import CicloVigenteFiltro from '@/components/planoSetorialProgramaMetas.componentes/QuadroDeAtividades/CicloVigenteFiltro.vue';
import {
  obterFaseIcone, listaDeFases, listaDeStatus, obterFaseStatus, obterFaseLegenda,
} from '@/components/planoSetorialProgramaMetas.componentes/QuadroDeAtividades/helpers/obterDadosItems';
import CicloListaItem, { type CicloVigenteItemParams, type ListaVariaveis } from '@/components/planoSetorialProgramaMetas.componentes/QuadroDeAtividades/CicloListaItem.vue';
import { usePanoramaPlanoSetorialStore } from '@/stores/planoSetorial.panorama.store';
import dateToTitle from '@/helpers/dateToTitle';

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

const legendas = {
  situacao: listaDeFases.map((item) => ({
    item: obterFaseLegenda(item),
    icon: obterFaseIcone(item),
  })),
  status: listaDeStatus.map((item) => ({
    item,
    icon: obterFaseStatus(item === 'atualizado'),
  })),
};

const listaDeMetasPreparado = computed(() => listaMetas.value.map<CicloVigenteItemParams>(
  (item) => ({
    titulo: item.titulo,
    id: item.id,
    metaId: item.meta_id || 11,
    iniciativaId: item.meta_id,
    atividadeId: item.atividade_id,
    variaveis: item.variaveis as ListaVariaveis,
    situacoes: item.monitoramento_ciclo,
    pendencias: {
      cronograma: item.pendencia_cronograma,
      orcamento: item.pendencia_orcamento,
    },
  }),
));

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

  <ErrorComponent v-if="erros.variaveis">
    {{ erros.variaveis }}
  </ErrorComponent>

  <LoadingComponent v-else-if="chamadasPendentes.variaveis" />

  <div
    v-else
    class="lista-de-cartoes"
  >
    <template v-if="route.query.visao_pessoal">
      <CardEnvelope.Conteudo class="container-inline">
        <CardEnvelope.Titulo titulo="Situações das variáveis" />
        <GraficoDeSituacoesDasVariaveis
          :variaveis="variaveis.associadas_plano_atual"
        />
      </CardEnvelope.Conteudo>

      <CardEnvelope.Conteudo>
        <CardEnvelope.Titulo titulo="Outras variáveis do órgão não associadas ao PS/PdM" />
        <GraficoDeSituacoesDasVariaveis
          :variaveis="variaveis.nao_associadas_plano_atual"
          :cores="['#292279', '#4539ca', '#5345f3', '#8c83f7', '#c6c1fb']"
        />
      </CardEnvelope.conteudo>
    </template>

    <CardEnvelope.Conteudo class="container-inline grid-full-column">
      <CardEnvelope.Titulo titulo="Metas" />
      <GrandesNumerosDeMetas
        :metas="estatisticasMetas"
      />
    </CardEnvelope.Conteudo>
  </div>

  <section class="sessao-metas mt4">
    <h2 class="subtitulo t24 w400 mb0">
      Metas
    </h2>

    <article class="sessao-metas__cabecalho flex spacebetween end g3">
      <CicloVigenteFiltro />

      <ListaLegendas
        class="sessao-metas__cabecalho-legenda"
        :legendas="legendas"
        orientacao="horizontal"
      >
        <template #padrao--status="{ item: { item, icon} }">
          <dt :style="{ backgroundColor: icon }" />

          <dd>{{ item }}</dd>
        </template>
      </ListaLegendas>
    </article>

    <section class="mt2 flex column g2">
      <CicloListaItem
        v-for="(item, itemIndex) in listaDeMetasPreparado"
        :key="itemIndex"
        v-bind="item"
      />
    </section>
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
    z-index: 1;

    margin-right: -21px !important;
    margin-left: -21px !important;
    padding-right: 21px !important;
    padding-left: 21px !important;

    &--congelado {
      .congelado-no-topo();
    }
  }
}

.formulario-sujo ~ * {
  .dados-defasados();
}

.sessao-metas__cabecalho {
  @media screen and (max-width: 55em) {
    flex-direction: column;

    .sessao-metas__cabecalho-legenda {
      width: 100%;
    }
  }
}
</style>
