<template>
  <div
    class="flex spacebetween fixed"
  >
    <h5>ÚLTIMA ATUALIZAÇÃO {{ formatarData(data) }}</h5>
    <button
      class="like-a__text margintop"
      @click="exibirFiltros=!exibirFiltros"
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
    class="flex g1"
  >
    <!-- - Etapas
      - Datas
      - Partidos
      - Parlamentos -->
    <Field
      name="data"
      type="date"
      class="inputtext light"
    />
    <select class="inputtext  light">
      <option value>
        Partido
      </option>
      <option
        v-for="partido in Object.values(listaPartidos)"
        :key="partido.id"
        :value="partido.id"
      >
        {{ partido.sigla }}
      </option>
    </select>
    <select class="inputtext light ">
      <option value>
        Parlamentar
      </option>
      <option
        v-for="parlamentar in Object.values(listaParlamentares)"
        :key="parlamentar.id"
        :value="parlamentar.id"
      >
        {{ parlamentar.nome }}
      </option>
    </select>
    <button
      class="btn small"
      @click="filtrar"
    >
      Filtrar
    </button>
  </div>

  <div class="g1">
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
import { Field } from 'vee-validate';
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { usePartidosStore } from '@/stores/partidos.store';
import { useParlamentaresStore } from '@/stores/parlamentares.store';
import ValorTransferencia from '../../components/graficos/ValorTransferencia.vue';

const partidoStore = usePartidosStore();
const parlamentarStore = useParlamentaresStore();

const { lista: listaPartidos, chamadasPendentes: chamadasPendentesPartidos } = storeToRefs(partidoStore);
const {
  lista: listaParlamentares, chamadasPendentes: chamadasPendentesParlamentares, erro,
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

const formatarData = (dataToFormat) => {
  const novaData = new Date(dataToFormat);

  const dia = novaData.getDate().toString().padStart(2, '0');
  const mes = (novaData.getMonth() + 1).toString().padStart(2, '0');
  const ano = novaData.getFullYear();
  const hora = novaData.getHours().toString().padStart(2, '0');
  const minuto = novaData.getMinutes().toString().padStart(2, '0');
  // const data = novaData.toLocaleDateString();
  // const [hora, min] = novaData.toLocaleTimeString().split(':');
  return `${dia}/${mes}/${ano} ÁS ${hora}:${minuto}`;
};

if (exibirFiltros.value) {
  parlamentarStore.buscarTudo();
  partidoStore.buscarTudo();
}
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

.margintop{
  margin-top: -105px;
}

input, select{
  background-color: #ffffff !important;
}

</style>
