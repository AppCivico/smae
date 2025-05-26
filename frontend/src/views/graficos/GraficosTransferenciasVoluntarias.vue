<template>
  <div class="flex spacebetween fixed">
    <h5>ANÁLISE GERADA EM {{ localizeDate(data) }}</h5>
    <button
      class="like-a__text margintop"
      @click="exibirFiltros = !exibirFiltros"
    >
      <svg
        v-if="exibirFiltros"
        width="20"
        height="20"
      >
        <use xlink:href="#i_x" />
      </svg>
      <svg
        v-else
        width="30"
        height="30"
        viewBox="0 0 30 30"
        fill="none"
      >
        <use xlink:href="#i_filter-button" />
      </svg>
    </button>
  </div>
  <LoadingComponent
    v-if="graficosPendentes"
    class="loading"
  />

  <ErrorComponent
    v-if="erroNaListaDeEtapas"
    class="mb1"
  >
    {{ erroNaListaDeEtapas }}
  </ErrorComponent>

  <div
    v-if="exibirFiltros"
    class="bgb p15 w100 filtro-de-graficos"
  >
    <form
      class="flex flexwrap g1 start"
      @submit.prevent="onSubmit"
    >
      <div class="f1">
        <label class="tc300">Etapas</label>
        <AutocompleteField
          :disabled="!listaEtapas.length"
          :controlador="{
            busca: '',
            participantes: filtrosEscolhidos.etapa_ids || [],
          }"
          :class="{
            loading: chamadasPendentesEtapas.lista,
          }"
          :grupo="listaEtapas"
          label="descricao"
        />
      </div>

      <div class="f1">
        <label class="tc300">Anos</label>
        <AutocompleteField
          :disabled="!anos.length"
          :controlador="{
            busca: '',
            participantes: filtrosEscolhidos.anos || [],
          }"
          :grupo="anos"
          label="ano"
        />
      </div>
      <div class="f1">
        <label class="tc300">Partidos</label>
        <AutocompleteField
          :disabled="!listaPartidos.length"
          :controlador="{
            busca: '',
            participantes: filtrosEscolhidos.partido_ids || [],
          }"
          :class="{
            loading: chamadasPendentesPartidos.lista,
          }"
          :grupo="listaPartidos"
          label="sigla"
        />
      </div>

      <div class="f1">
        <label class="tc300">Parlamentares</label>
        <AutocompleteField
          :disabled="!listaParlamentares.length"
          :controlador="{
            busca: '',
            participantes: filtrosEscolhidos.parlamentar_ids || [],
          }"
          :class="{
            loading: chamadasPendentesParlamentares.lista,
          }"
          :grupo="listaParlamentares"
          label="nome_popular"
        />
      </div>
      <button
        class="btn small mt1"
        type="submit"
      >
        Filtrar
      </button>
    </form>
  </div>
  <div
    v-if="!exibirFiltros && !graficosPendentes"
    class="g1"
  >
    <span
      v-for="etapa in route.query.etapa_ids"
      :key="etapa"
      class="tagfilter"
    >
      {{ etapasPorId[etapa]?.descricao || etapa }}
    </span>

    <span
      v-for="ano in route.query.anos"
      :key="ano"
      class="tagfilter"
    >
      {{ ano }}
    </span>

    <span
      v-for="partido in route.query.partido_ids"
      :key="partido"
      class="tagfilter"
    >
      {{ partidosPorId[partido]?.sigla || partido }}
    </span>

    <span
      v-for="parlamentar in route.query.parlamentar_ids"
      :key="parlamentar"
      class="tagfilter"
    >
      {{ parlamentaresPorId[parlamentar]?.nome_popular || parlamentar }}
    </span>
  </div>
  <div
    v-if="graficos?.values?.valor_total"
    class="flex flexwrap gap50 center mt4 mb2"
  >
    <ValorTransferencia
      class="f1"
      :valor="graficos?.values?.valor_total"
    />
    <div
      v-if="graficos?.values?.numero_por_esfera && graficos?.values?.valor_total"
      class="bgb br20 p15 f1"
    >
      <h2 class="t36">
        {{ graficos?.values?.numero_por_esfera.title.text }}
      </h2>
      <Grafico :option="removeTitleProperty(graficos?.values?.numero_por_esfera)" />
    </div>
  </div>
  <div
    v-if="graficos?.values?.numero_por_status && graficos?.values?.valor_total"
    class="w100 bgb mt4 p15"
  >
    <h2 class="t36">
      {{ graficos.values.numero_por_status.title.text }}
    </h2>
    <Grafico :option="removeTitleProperty(graficos.values.numero_por_status)" />
  </div>
  <div
    v-if="graficos?.values?.numero_por_partido && graficos?.values?.valor_total"
    class="w100 bgb mt4 p15"
  >
    <h2 class="t36">
      {{ graficos.values.numero_por_partido.title.text }}
    </h2>
    <Grafico :option="removeTitleProperty(graficos.values.numero_por_partido)" />
  </div>
  <div
    v-if="graficos?.values?.valor_por_partido && graficos?.values?.valor_total"
    class="w100 bgb mt4 p15"
  >
    <h2 class="t36">
      {{ graficos.values.valor_por_partido.title.text }}
    </h2>
    <Grafico :option="removeTitleProperty(graficos.values.valor_por_partido)" />
  </div>
  <div
    v-if="graficos?.values?.valor_por_orgao && graficos?.values?.valor_total"
    class="w100 bgb mt4 p15"
  >
    <h2 class="t36">
      {{ graficos.values.valor_por_orgao.title.text }}
    </h2>
    <Grafico :option="removeTitleProperty(graficos.values.valor_por_orgao)" />
  </div>
  <div
    v-if=" graficos?.values?.valor_por_parlamentar.length && graficos?.values?.valor_total"
    class="w100 bgb mt4 p15 "
  >
    <h2 class="t36 block">
      Valores de destaque
    </h2>
    <div class="flex flexwrap g2">
      <div
        v-for="parlamentar in graficos?.values?.valor_por_parlamentar"
        :key="parlamentar.id"
        class="parlamentar"
      >
        <div class="img-container">
          <img
            class="img"
            :src="`${baseUrl}/download/${parlamentar.parlamentar.foto}`"
          >
        </div>
        <p>{{ parlamentar.parlamentar.nome_popular }}</p>
        <p>R${{ dinheiro(parlamentar.valor, true) }}</p>
      </div>
    </div>
  </div>
  <div class="w100 bgb mt4 p15">
    <h2
      ref="tabelaTransferencias"
      class="t36 block"
    >
      Transferências
    </h2>
    <div class="grid g2 relative">
      <SmaeTable
        titulo-rolagem-horizontal="Tabela: Transferências"
        class="mt2"
        rolagem-horizontal
        :colunas="colunas"
        :dados="transferencias"
      >
        <template #celula:identificador="{ linha }">
          <SmaeLink
            v-if="linha?.id"
            :to="{
              name: 'TransferenciasVoluntariasDetalhes',
              params: { transferenciaId: linha.id },
            }"
            class="tprimary w700"
          >
            {{ linha.identificador }}
          </SmaeLink>
        </template>
      </SmaeTable>
      <MenuPaginacao
        v-if="paginacaoTransferencias.temMais"
        class="mt2 bgt"
        v-bind="paginacaoTransferencias"
        prefixo="transferencias_"
        @troca-de-pagina-solicitada="scrollPaginaParaTabela"
      />
      <LoadingComponent
        v-if="carregandoTransferencias"
        :sobrepoe-conteudo="true"
      />
    </div>
  </div>
</template>
<script setup>
import requestS from '@/helpers/requestS.ts';
import dateToDate from '@/helpers/dateToDate';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import Grafico from '@/components/graficos/GraficoDashboard.vue';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import dinheiro from '@/helpers/dinheiro';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import ValorTransferencia from '@/components/graficos/ValorTransferencia.vue';
import combinadorDeListas from '@/helpers/combinadorDeListas';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import isEqual from 'lodash/isEqual';

const localizeDate = (d) => dateToDate(d, { timeStyle: 'short', timeZone: 'America/Sao_Paulo' });
const fluxosEtapasProjetos = useEtapasProjetosStore();
const partidoStore = usePartidosStore();
const parlamentarStore = useParlamentaresStore();

// eslint-disable-next-line max-len
const {
  lista: listaEtapas,
  chamadasPendentes: chamadasPendentesEtapas,
  etapasPorId,
  erro: erroNaListaDeEtapas,
} = storeToRefs(fluxosEtapasProjetos);

// eslint-disable-next-line max-len
const { lista: listaPartidos, chamadasPendentes: chamadasPendentesPartidos, partidosPorId } = storeToRefs(partidoStore);

const {
  lista: listaParlamentares,
  chamadasPendentes: chamadasPendentesParlamentares,
  parlamentaresPorId,
} = storeToRefs(parlamentarStore);

// eslint-disable-next-line prefer-const
let exibirFiltros = ref(false);
const tabelaTransferencias = ref(null);

const route = useRoute();
const router = useRouter();

let data = new Date();
const baseUrl = `${import.meta.env.VITE_API_URL}`;
const graficos = ref({});
let graficosPendentes = false;
const filtrosEscolhidos = ref({
  etapa_ids: route.query.etapa_ids?.map((id) => Number(id)) || [],
  anos: route.query.anos?.map((ano) => Number(ano)) || [],
  partido_ids: route.query.partido_ids?.map((id) => Number(id)) || [],
  parlamentar_ids: route.query.parlamentar_ids?.map((id) => Number(id)) || [],
});
const carregandoTransferencias = ref(false);
const transferencias = ref([]);
const paginacaoTransferencias = ref({});
const colunas = [
  { chave: 'identificador', label: 'Identificador' },
  { chave: 'esfera', label: 'Esfera' },
  { chave: 'tipo.nome', label: 'Tipo' },
  {
    chave: 'partido',
    label: 'Partidos',
    formatador: (valor) => (valor ? combinadorDeListas(valor, ', ', 'sigla') : ''),
  },
  {
    chave: 'parlamentar',
    label: 'Parlamentares',
    formatador: (valor) => (valor ? combinadorDeListas(valor, ', ', 'nome_popular') : ''),
  },
  { chave: 'orgao_gestor.sigla', label: 'Órgão Gestor' },
  {
    chave: 'objeto',
    label: 'Objeto',
    formatador: (valor = '') => `${valor.substring(0, 100)}${valor.length > 100 ? '...' : ''}`,
  },
  {
    chave: 'repasse',
    label: 'Repasse',
    formatador: (valor) => (valor !== undefined && valor !== null ? `R$${dinheiro(valor)}` : '-'),
  },
  {
    chave: 'etapa_id',
    label: 'Etapa',
    formatador: (valor) => listaEtapas.value.find((etapa) => etapa.id === valor)?.descricao || 'Workflow não iniciado',
  },
];

const anoAtual = new Date().getFullYear();

const anos = [];

for (let ano = anoAtual; ano >= 2004; ano -= 1) {
  anos.push({ ano: ano.toString(), id: ano });
}

function atualizarQuery() {
  const filtrosLimpos = Object.keys(filtrosEscolhidos.value).reduce(
    (acc, cur) => {
      if (filtrosEscolhidos.value[cur].length) {
        acc[cur] = [...filtrosEscolhidos.value[cur]];
      } else {
        acc[cur] = undefined;
      }
      return acc;
    },
    {},
  );

  router.replace({
    query: {
      ...route.query,
      ...filtrosLimpos,
    },
  });
}

function onSubmit() {
  atualizarQuery();
  data = new Date();
  exibirFiltros.value = false;
}

function removeTitleProperty(obj) {
  const { title, ...rest } = obj;
  return rest;
}

async function buscarGraficos() {
  graficosPendentes = true;
  try {
    const retorno = await requestS.get(
      `${baseUrl}/panorama/analise-transferencias`,
      route.query,
    );
    graficos.value.values = retorno;
    graficosPendentes = false;
  } catch (error) {
    graficosPendentes = false;
    console.log('error:', error);
  }
}

async function buscarTransferencias() {
  carregandoTransferencias.value = true;

  const paramsLimpos = Object.entries(route.query).reduce((acc, [key, value]) => {
    if (!key.startsWith('transferencias_')) {
      acc[key] = value;
    } else {
      acc[key.replace('transferencias_', '')] = value;
    }
    return acc;
  }, {});

  try {
    const retorno = await requestS.get(
      `${baseUrl}/panorama/painel-estrategico-transferencias`,
      paramsLimpos,
    );
    paginacaoTransferencias.value = {
      temMais: true,
      paginas: retorno.paginas,
      tokenPaginacao: retorno.token_paginacao,
      tokenProximaPagina: retorno.token_paginacao,
      paginaCorrente: retorno.pagina_corrente,
      totalRegistros: retorno.total_registros,
      tokenTtl: retorno.token_ttl,
    };

    transferencias.value = retorno.linhas;
  } catch (erro) {
    console.log('error:', erro);
  } finally {
    carregandoTransferencias.value = false;
  }
}

function scrollPaginaParaTabela() {
  if (tabelaTransferencias.value) {
    tabelaTransferencias.value.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  }
}

async function iniciar() {
  fluxosEtapasProjetos.buscarTudo();
  parlamentarStore.buscarTudo();
  partidoStore.buscarTudo();

  atualizarQuery();
  if (!Object.keys(route.query).length) {
    await router.replace({
      query: {
        ...route.query,
        anos: [data.getFullYear()],
      },
    });
  }
  buscarGraficos();
  buscarTransferencias();
}

iniciar();

function resetarPaginacao() {
  paginacaoTransferencias.value = {
    temMais: true,
    paginas: 1,
    tokenPaginacao: null,
    tokenProximaPagina: null,
    paginaCorrente: 1,
    totalRegistros: 0,
    tokenTtl: null,
  };

  const querySemTransferencias = Object.fromEntries(
    Object.entries(route.query).filter(
      ([key]) => !key.startsWith('transferencias_'),
    ),
  );

  router.replace({
    query: {
      ...querySemTransferencias,
      transferencias_pagina: 1,
    },
  });
}

watch(
  () => route.query,
  (queryNova, queryAnterior) => {
    const queryStringsDosFiltrosNova = Object
      .fromEntries(Object.entries(queryNova)
        .filter(([key]) => !key.startsWith('transferencias_')));

    const queryStringsDosFiltrosAntiga = Object
      .fromEntries(Object.entries(queryAnterior)
        .filter(([key]) => !key.startsWith('transferencias_')));

    const queryStringsDeTransferenciasNova = Object.fromEntries(Object.entries(queryNova).filter(([key]) => key.startsWith('transferencias_')));
    const queryStringsDeTransferenciasAntiga = Object.fromEntries(Object.entries(queryAnterior).filter(([key]) => key.startsWith('transferencias_')));

    const teveMudancaNaQueryDosFiltros = !isEqual(
      queryStringsDosFiltrosNova,
      queryStringsDosFiltrosAntiga,
    );

    const teveMudancaNaQueryDasTransferencias = !isEqual(
      queryStringsDeTransferenciasNova,
      queryStringsDeTransferenciasAntiga,
    );

    filtrosEscolhidos.value = {
      etapa_ids: route.query.etapa_ids?.map((id) => Number(id)) || [],
      anos: route.query.anos?.map((ano) => Number(ano)) || [],
      partido_ids: route.query.partido_ids?.map((id) => Number(id)) || [],
      parlamentar_ids: route.query.parlamentar_ids?.map((id) => Number(id)) || [],
    };

    if (teveMudancaNaQueryDosFiltros) {
      resetarPaginacao(); // resetar a paginação já faz o request para buscar as transferências
      buscarGraficos();
    }

    if (teveMudancaNaQueryDasTransferencias) {
      buscarTransferencias();
    }
  },
);
</script>

<style scoped>
.chart {
  height: 400px;
  max-width: 800px;
  min-width: 500px;
  min-height: 400px;
}

.tagfilter {
  background-color: #e2eafe;
  color: #152741;
  font-size: 17px;
  line-height: 22px;
  border-radius: 12px;
  padding: 3.5px 12px;
  margin: 5px 5px 0 0;
}

.margintop {
  margin-top: -105px;
}

.w100 {
  width: calc(100% + 100px);
  margin-left: -50px;
  margin-right: -50px;
  box-shadow: 0px 8px 16px 0px #1527411a;
}
.parlamentar {
  box-shadow: 0px 8px 16px 0px #1527411a;
  padding: 10px 40px;
  border-radius: 10px;
  p {
    text-align: center;
    font-size: 30px;
    margin-bottom: 0px;
  }

  p:last-child {
    font-size: 20px;
  }
}
.img-container {
  width: 240px;
  height: 240px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

h2 {
  margin-top: -45px;
}

.gap50{
  gap:50px;
}

.loading{
  margin-top: 25px;
  color: #152741;
}
</style>

<style>
.filtro-de-graficos ~ * div,
.filtro-de-graficos ~ * h2 {
  filter: saturate(10%) grayscale(80%) blur(2px);;
}
</style>
