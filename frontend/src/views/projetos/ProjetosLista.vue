<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import LocalFilter from '@/components/LocalFilter.vue';
import TabelaDeProjetos from '@/components/projetos/TabelaDeProjetos.vue';
import statuses from '@/consts/projectStatuses';
import arrayToValueAndLabel from '@/helpers/arrayToValueAndLabel';
import { useAuthStore } from '@/stores/auth.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const projetosStore = useProjetosStore();
const {
  chamadasPendentes, erro, lista,
} = storeToRefs(projetosStore);
const route = useRoute();
const router = useRouter();

const listaDeStatuses = arrayToValueAndLabel(statuses)
  .map((x) => ({ ...x, id: x.valor.toLowerCase() }));

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
    type: Array,
    default: () => [],
    validator: (value) => !value?.length || !!value.find((x) => !statuses[x.toLowerCase()]),
  },
});

const parâmetros = ref({});
const listaFiltradaPorTermoDeBusca = ref([]);

const status = props.status.map((x) => statusesPorChaveCaixaBaixa[x]?.valor);

if (status.length) {
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

const listasAgrupadas = computed(() => listaFiltradaPorTermoDeBusca.value?.reduce((acc, cur) => {
  if (!acc[cur.portfolio.id]) {
    acc[cur.portfolio.id] = { ...cur.portfolio, lista: [] };
  }
  acc[cur.portfolio.id].lista.push(cur);
  return acc;
}, {}) || {});

</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Projetos
    </TítuloDePágina>

    <hr class="ml2 f1">

    <router-link
      v-if="temPermissãoPara('Projeto.administrador_no_orgao')"
      :to="{ name: 'projetosCriar' }"
      class="btn big ml1"
    >
      Novo projeto
    </router-link>
  </div>

  <div class="flex center mb2 spacebetween">
    <div class="f1 mr1">
      <label class="label tc300">Filtrar por status</label>
      <AutocompleteField
        name="orgaos"
        :controlador="{ busca: '', participantes: props.status || [] }"
        :grupo="listaDeStatuses"
        label="etiqueta"
        @change="($event) => router.push({
          name: route.name,
          query: { status: $event || undefined }
        })"
      />
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
      Ativos
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
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="lista"
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
        <details
          v-for="item in Object.keys(listasAgrupadas)"
          :key="item"
          class="board board--flex f100"
          :open="Object.keys(listasAgrupadas).length === 1 ? true : null"
        >
          <summary>
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
          </summary>

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
        </details>
      </div>
    </template>
  </div>
</template>
