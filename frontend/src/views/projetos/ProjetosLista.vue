<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import TabelaDeProjetos from '@/components/projetos/TabelaDeProjetos.vue';
import statuses from '@/consts/statuses';
import { useProjetosStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const projetosStore = useProjetosStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(projetosStore);
const route = useRoute();
const router = useRouter();

const listaDeStatuses = Object.keys(statuses).map((x) => ({
  etiqueta: statuses[x],
  valor: x.toLowerCase(),
}));

const statusesPorChaveCaixaBaixa = Object.keys(statuses).reduce((acc, cur) => ({
  ...acc, [cur.toLowerCase()]: { valor: cur, etiqueta: statuses[cur] },
}), {});

const props = defineProps({
  apenasPrioritários: {
    type: Boolean,
    default: false,
  },
  apenasArquivados: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    default: '',
    validator: (value) => !value || !!statuses[value.toLowerCase()],
  },
});

const parâmetros = ref({});
const termoDeBusca = ref('');

const status = statusesPorChaveCaixaBaixa[props.status]?.valor || '';

if (status) {
  parâmetros.value.status = status;
}

if (props.apenasPrioritários) {
  parâmetros.value.eh_prioritario = true;
  parâmetros.value.arquivado = false;
} else if (props.apenasArquivados) {
  parâmetros.value.arquivado = true;
}

projetosStore.$reset();
projetosStore.buscarTudo(parâmetros.value);

const listaFiltrada = computed(() => projetosStore.listaFiltradaPor(termoDeBusca.value));

const listasAgrupadas = computed(() => listaFiltrada.value?.reduce((acc, cur) => {
  if (!acc[cur.portfolio.id]) {
    acc[cur.portfolio.id] = { ...cur.portfolio, lista: [] };
  }
  acc[cur.portfolio.id].lista.push(cur);
  return acc;
}, {}) || {});

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Projetos' }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'projetosCriar' }"
      class="btn big ml1"
    >
      Novo projeto
    </router-link>
  </div>

  <div class="flex center mb2 spacebetween">
    <div class="f1 mr1">
      <label class="label tc300">Filtrar por status</label>
      <select
        class="inputtext"
        @change="($event) => router.push({
          name: route.name,
          query: { status: $event.target.value || undefined }
        })"
      >
        <option
          value=""
          :selected="!!status"
        >
          qualquer
        </option>
        <option
          v-for="item in listaDeStatuses"
          :key="item.valor"
          :value="item.valor"
          :selected="props.status === item.valor"
        >
          {{ item.etiqueta }}
        </option>
      </select>
    </div>
    <hr class="ml2 f1">
    <router-link
      v-show="route.name !== 'projetosListarArquivados'"
      :to="{
        name: 'projetosListarArquivados',
        query: route.query,
      }"
      class="btn bgnone outline ml1"
    >
      Arquivados
    </router-link>
    <router-link
      v-show="route.name !== 'projetosListarPrioritários'"
      :to="{
        name: 'projetosListarPrioritários',
        query: route.query,
      }"
      class="btn bgnone outline ml1"
    >
      Prioritários
    </router-link>
    <router-link
      v-show="route.name !== 'projetosListar'"
      :to="{
        name: 'projetosListar',
        query: route.query,
      }"
      class="btn bgnone outline ml1"
    >
      Todos
    </router-link>
  </div>

  <div class="flex center mb2 spacebetween">
    <LocalFilter
      v-model="termoDeBusca"
      class="mr1"
    />
    <hr class="ml2 f1">
  </div>

  <div
    v-if="chamadasPendentes.lista"
    aria-busy="true"
  >
    Carregando
  </div>

  <div
    v-else
    class="boards"
  >
    <template v-if="Object.keys(listasAgrupadas).length">
      <div class="flex flexwrap g2">
        <div
          v-for="item in Object.keys(listasAgrupadas)"
          :key="item"
          class="board board--flex"
        >
          <h2>{{ listasAgrupadas[item].titulo }}</h2>
          <div class="t11 tc300 mb2">
            {{ listasAgrupadas[item].lista.length }}
            <template v-if="listasAgrupadas[item].lista.length === 1">
              projeto
            </template>
            <template v-else>
              projetos
            </template>
          </div>

          <TabelaDeProjetos
            :lista="listasAgrupadas[item].lista"
            :pendente="chamadasPendentes.lista"
            :erro="erro"
          />

          <router-link
            :to="{ name: 'projetosCriar', query: { portfolio_id: listasAgrupadas[item].id } }"
            class="addlink mt1"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg>
            <span>Adicionar projeto a esse portfolio</span>
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>
