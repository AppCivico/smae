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
    class="flex flexwrap g1 start bgb p15 w100"
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
      @click="atualizarQuery"
    >
      Filtrar
    </button>
  </div>
  <div
    v-if="!exibirFiltros"
    class="g1"
  >
    <button
      v-for="etapa in filtrosAtivos.etapa_ids"
      :key="etapa"
      class="tagfilter"
    >
      {{ etapa }}
      <svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg>
    </button>
  </div>
  <div class="flex flexwrap g1 mt2 mb2">
    <ValorTransferencia
      v-if="filtrosAuxiliares?.values?.valor_total"
      class="f1"
      :valor="filtrosAuxiliares?.values?.valor_total"
    />
    <div
      v-if="filtrosAuxiliares?.values?.numero_por_esfera"
      class="bgb br20 p15 f1"
    >
      <v-chart
        class="chart"
        :option="filtrosAuxiliares.values.numero_por_esfera"
      />
    </div>
  </div>
  <div
    v-if="filtrosAuxiliares?.values?.numero_por_partido"
    class="w100 bgb mt2 p15"
  >
    <v-chart
      class="chart"
      :option="filtrosAuxiliares.values.numero_por_partido"
    />
  </div>
  <div
    v-if="filtrosAuxiliares?.values?.valor_por_partido"
    class="w100 bgb mt2 p15"
  >
    <v-chart
      class="chart"
      :option="filtrosAuxiliares.values.valor_por_partido"
    />
  </div>
  <div
    v-if="filtrosAuxiliares?.values?.valor_por_orgao"
    class="w100 bgb mt2 p15"
  >
    <v-chart
      class="chart"
      :option="filtrosAuxiliares.values.valor_por_orgao"
    />
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

const localizeDate = (d) => dateToDate(d, { timeStyle: 'short' });

const fluxosEtapasProjetos = useEtapasProjetosStore();
const partidoStore = usePartidosStore();
const parlamentarStore = useParlamentaresStore();

// eslint-disable-next-line max-len
const { lista: listaEtapas, chamadasPendentes: chamadasPendentesEtapas } = storeToRefs(fluxosEtapasProjetos);

// eslint-disable-next-line max-len
const { lista: listaPartidos, chamadasPendentes: chamadasPendentesPartidos } = storeToRefs(partidoStore);

const {
  lista: listaParlamentares,
  chamadasPendentes: chamadasPendentesParlamentares,
} = storeToRefs(parlamentarStore);

// eslint-disable-next-line prefer-const
let exibirFiltros = ref(false);

const route = useRoute();
const router = useRouter();

const data = '2024-05-08T15:30:00Z';
const baseUrl = `${import.meta.env.VITE_API_URL}`;
const filtrosAtivos = ref({});
const filtrosAuxiliares = ref({});

const filtrosEscolhidos = ref({
  etapa_idss: [],
  anos: [],
  partido_ids: [],
  parlamentar_ids: [],
});
const anoAtual = new Date().getFullYear();

const anos = [];

for (let ano = anoAtual; ano >= 2004; ano -= 1) {
  anos.push({ ano: ano.toString(), id: ano });
}

function atualizarQuery() {
  const filtrosLimpos = Object.keys(filtrosEscolhidos.value).reduce((acc, cur) => {
    if (filtrosEscolhidos.value[cur].length) {
      acc[cur] = [...filtrosEscolhidos.value[cur]];
    } else {
      acc[cur] = undefined;
    }
    return acc;
  }, {});

  router.replace({
    query: {
      ...route.query,
      ...filtrosLimpos,
    },
  });
}

async function buscarGraficos() {
  try {
    const retorno = await requestS.get(
      `${baseUrl}/panorama/analise-transferencias`,
      route.query,
    );
    filtrosAuxiliares.value.values = retorno;
  } catch (error) {
    console.log('error:', error);
  }
}

fluxosEtapasProjetos.buscarTudo();
parlamentarStore.buscarTudo();
partidoStore.buscarTudo();

watch(
  () => route.query,
  () => {
    buscarGraficos();
  },
);

buscarGraficos();
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
</style>
