<template>
  <div class="flex spacebetween fixed">
    <h5>ANÁLISE GERADA EM {{ localizeDate(data) }}</h5>
    <button
      class="like-a__text margintop"
      @click="exibirFiltros = !exibirFiltros"
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        fill="none"
      >
        <use xlink:href="#i_filter-button" />
      </svg>
    </button>
  </div>
  <div
    v-if="exibirFiltros"
    class="bgb p15 w100"
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
          name="teste1"
          :controlador="{
            busca: '',
            participantes: filtrosEscolhidos.parlamentar_ids || [],
          }"
          :class="{
            loading: chamadasPendentesParlamentares.lista,
          }"
          :grupo="listaParlamentares"
          label="nome"
        />
      </div>
      <button
        class="btn small mt1"
      >
        Filtrar
      </button>
    </form>
  </div>
  <div
    v-if="!exibirFiltros"
    class="g1"
  >
    <button
      v-for="etapa in route.query.etapa_ids"
      :key="etapa"
      class="tagfilter"
      @click="excluirParametro('etapa_ids', etapa)"
    >
      {{ etapasPorId[etapa]?.descricao || etapa }}
      <svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg>
    </button>

    <button
      v-for="ano in route.query.anos"
      :key="ano"
      class="tagfilter"
      @click="excluirParametro('anos', ano)"
    >
      {{ ano }}
      <svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg>
    </button>

    <button
      v-for="partido in route.query.partido_ids"
      :key="partido"
      class="tagfilter"
      @click="excluirParametro('partido_ids', partido)"
    >
      {{ partidosPorId[partido]?.nome || partido }}
      <svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg>
    </button>

    <button
      v-for="parlamentar in route.query.parlamentar_ids"
      :key="parlamentar"
      class="tagfilter"
      @click="excluirParametro('parlamentar_ids', parlamentar)"
    >
      {{ parlamentaresPorId[parlamentar]?.nome_popular || parlamentar }}
      <svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg>
    </button>
  </div>
  <div class="flex flexwrap center g1 mt2 mb2">
    <ValorTransferencia
      v-if="graficos?.values?.valor_total"
      class="f1"
      :valor="graficos?.values?.valor_total"
    />
    <div
      v-if="graficos?.values?.numero_por_esfera"
      class="bgb br20 p15 f1"
    >
      <v-chart
        class="chart"
        :option="graficos.values.numero_por_esfera"
      />
    </div>
  </div>
  <div
    v-if="graficos?.values?.numero_por_partido"
    class="w100 bgb mt2 p15"
  >
    <v-chart
      class="chart"
      :option="graficos.values.numero_por_partido"
    />
  </div>
  <div
    v-if="graficos?.values?.valor_por_partido"
    class="w100 bgb mt2 p15"
  >
    <v-chart
      class="chart"
      :option="graficos.values.valor_por_partido"
    />
  </div>
  <div
    v-if="graficos?.values?.valor_por_orgao"
    class="w100 bgb mt2 p15"
  >
    <v-chart
      class="chart"
      :option="graficos.values.valor_por_orgao"
    />
  </div>
  <div class="w100 bgb mt2 p15 flex flexwrap g2">
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
</template>

<script setup>
import requestS from '@/helpers/requestS.ts';
import dateToDate from '@/helpers/dateToDate';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { ref, watch, provide } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import dinheiro from '@/helpers/dinheiro';

import { use } from 'echarts/core';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';

import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import ValorTransferencia from '../../components/graficos/ValorTransferencia.vue';

use([
  CanvasRenderer,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  BarChart,
]);

provide(THEME_KEY, 'light');

const localizeDate = (d) => dateToDate(d, { timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

const fluxosEtapasProjetos = useEtapasProjetosStore();
const partidoStore = usePartidosStore();
const parlamentarStore = useParlamentaresStore();

// eslint-disable-next-line max-len
const { lista: listaEtapas, chamadasPendentes: chamadasPendentesEtapas, etapasPorId } = storeToRefs(fluxosEtapasProjetos);

// eslint-disable-next-line max-len
const { lista: listaPartidos, chamadasPendentes: chamadasPendentesPartidos, partidosPorId } = storeToRefs(partidoStore);

const {
  lista: listaParlamentares,
  chamadasPendentes: chamadasPendentesParlamentares,
  parlamentaresPorId,
} = storeToRefs(parlamentarStore);

// eslint-disable-next-line prefer-const
let exibirFiltros = ref(false);

const route = useRoute();
const router = useRouter();

let data = new Date();
const baseUrl = `${import.meta.env.VITE_API_URL}`;
// const filtrosAtivos = ref({});
const graficos = ref({});

const filtrosEscolhidos = ref({
  etapa_ids: Array.isArray(route.query.etapa_ids)
    ? [...route.query.etapa_ids]
    : [],
  anos: Array.isArray(route.query.anos)
    ? [...route.query.anos]
    : [],
  partido_ids: Array.isArray(route.query.partido_ids)
    ? [...route.query.partido_ids]
    : [],
  parlamentar_ids: Array.isArray(route.query.parlamentar_ids)
    ? [...route.query.parlamentar_ids]
    : [],
});

const anoAtual = new Date().getFullYear();

const anos = [];

for (let ano = anoAtual; ano >= 2004; ano -= 1) {
  anos.push({ ano: ano.toString(), id: ano });
}

function excluirParametro(parametro, id) {
  const queryAtualizada = { ...route.query };
  if (Array.isArray(queryAtualizada[parametro])) {
    queryAtualizada[parametro] = queryAtualizada[parametro].filter((item) => item !== id);
  }
  router.replace({ query: queryAtualizada });
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

function iniciar() {
  fluxosEtapasProjetos.buscarTudo();
  parlamentarStore.buscarTudo();
  partidoStore.buscarTudo();

  atualizarQuery();

  if (!route.query.ano) {
    router.replace({
      query: {
        ...route.query,
        anos: [2024],
      },
    });
    filtrosEscolhidos.value.anos.push(2024);
  }
}

async function buscarGraficos() {
  try {
    const retorno = await requestS.get(
      `${baseUrl}/panorama/analise-transferencias`,
      route.query,
    );
    graficos.value.values = retorno;
  } catch (error) {
    console.log('error:', error);
  }
}

iniciar();

watch(
  () => route.query,
  () => {
    buscarGraficos();
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
  border: none;
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
.parlamentar{
  box-shadow: 0px 8px 16px 0px #1527411A;
  padding: 10px 40px;
  p{
    text-align: center;
    font-size: 30px;
    margin-bottom: 0px;
  }

  p:last-child{
    font-size: 20px;
  }
}
.img-container {
  width: 240px;
  height: 240px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px
}

.img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
