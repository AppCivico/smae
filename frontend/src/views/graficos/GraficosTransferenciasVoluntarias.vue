<template>
  <div class="flex spacebetween fixed">
    <h5>ÚLTIMA ATUALIZAÇÃO {{ localizeDate(data) }}</h5>
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
    class="flex g1 start"
  >
    <div class="f1">
      <label class="tc300">Etapas</label>
      <AutocompleteField
        :disabled="!listaEtapas.length"
        :controlador="{
          busca: '',
          participantes: filtrosAtivos.etapas || [],
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
          participantes: filtrosAtivos.anos || [],
        }"
        :grupo="anos"
        label="ano"
        class="bgb"
      />
    </div>

    <div class="f1">
      <label class="tc300">Partidos</label>
      <AutocompleteField
        :disabled="!listaPartidos.length"
        :controlador="{
          busca: '',
          participantes: filtrosAtivos.partidos || [],
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
          participantes: filtrosAtivos.parlamentares || [],
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
      :disabled="true"
      @click="filtrar"
    >
      Filtrar
    </button>
  </div>

  <div
    v-if="!exibirFiltros"
    class="g1"
  >
    <button
      v-for="(filtro, index) in filtrosAtivos"
      :key="index"
      class="tagfilter"
    >
      {{ filtro }}
      <svg
        width="12"
        height="12"
      ><use xlink:href="#i_x" /></svg>
    </button>
  </div>
  <section>
    <ValorTransferencia :valor="valor" />
  </section>
</template>

<script setup>
import dateToDate from '@/helpers/dateToDate';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';
import { usePartidosStore } from '@/stores/partidos.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import ValorTransferencia from '../../components/graficos/ValorTransferencia.vue';

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

const valor = 984675909;
const data = '2024-05-08T15:30:00Z';
// eslint-disable-next-line prefer-const
let exibirFiltros = ref(false);

const filtrosAtivos = [
  'SGM/SEPEP - Projetos Especiais',
  'Em contratação de obras',
  'De 2023 até 2024',
  'Partido',
  'Parlamentar',
];

const anoAtual = new Date().getFullYear();

const anos = [];

for (let ano = 2004; ano <= anoAtual; ano += 1) {
  anos.push({ ano: ano.toString(), id: ano });
}

function filtrar() {
  console.log('filtrou');
}

fluxosEtapasProjetos.buscarTudo();
parlamentarStore.buscarTudo();
partidoStore.buscarTudo();
</script>

<style scoped>
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

input,
select,
.white {
  background-color: #ffffff !important;
}
</style>
