<script setup>
import AutocompleteField from '@/components/AutocompleteField2.vue';
import LocalFilter from '@/components/LocalFilter.vue';
import TabelaDeProjetos from '@/components/projetos/TabelaDeProjetos.vue';
import statuses from '@/consts/projectStatuses';
import arrayToValueAndLabel from '@/helpers/arrayToValueAndLabel';
import { useAuthStore } from '@/stores/auth.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
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

const listaFiltradaPorTermoDeBusca = ref([]);

projetosStore.$reset();

const listasAgrupadas = computed(() => listaFiltradaPorTermoDeBusca.value?.reduce((acc, cur) => {
  if (!acc[cur.portfolio.id]) {
    acc[cur.portfolio.id] = { ...cur.portfolio, lista: [] };
  }

  if (Array.isArray(cur.portfolios_compartilhados)) {
    cur.portfolios_compartilhados.forEach((x) => {
      if (!acc[x.id]) {
        acc[x.id] = { ...x, lista: [] };
      }
      acc[x.id].lista.push(cur);
    });
  }

  acc[cur.portfolio.id].lista.push(cur);

  return acc;
}, {}) || {});

watch(props, (novoValor) => {
  const valores = {};

  if (novoValor.status.length) {
    valores.status = novoValor.status.map((x) => statusesPorChaveCaixaBaixa[x]?.valor);
  }
  if (novoValor.apenasPrioritários) {
    valores.eh_prioritario = true;
    valores.arquivado = false;
  } else if (novoValor.apenasArquivados) {
    valores.arquivado = true;
  }

  projetosStore.buscarTudo(valores);
}, { immediate: true });
</script>
<template>
  <div class="flex spacebetween center mb2 g2">
    <TítuloDePágina>
      Portfólios
    </TítuloDePágina>

    <hr class="f1">

    <router-link
      v-if="temPermissãoPara('Projeto.administrador_no_orgao')"
      :to="{ name: 'projetosCriar' }"
      class="btn big"
    >
      Novo projeto
    </router-link>
  </div>

  <div class="flex center mb2 spacebetween g2">
    <div class="f1">
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
    <hr class="f1">
    <nav class="flex g1">
      <router-link
        :to="{
          name: 'projetosListarArquivados',
          query: route.query,
        }"
        :class="{
          tcamarelo: route.name === 'projetosListarArquivados'
        }"
        class="btn bgnone outline tcprimary"
      >
        Arquivados
      </router-link>
      <router-link
        :to="{
          name: 'projetosListarPrioritários',
          query: route.query,
        }"
        :class="{
          tcamarelo: route.name === 'projetosListarPrioritários'
        }"
        class="btn bgnone outline tcprimary"
      >
        Ativos
      </router-link>
      <router-link
        :to="{
          name: 'projetosListar',
          query: route.query,
        }"
        :class="{
          tcamarelo: route.name === 'projetosListar'
        }"
        class="btn bgnone outline tcprimary"
      >
        Todos
      </router-link>
    </nav>
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
          :id="`portfolio--${listasAgrupadas[item].id}`"
          :key="item"
          class="board board--flex fb100"
          :open="Object.keys(listasAgrupadas).length === 1
            || $route.hash === `#portfolio--${listasAgrupadas[item].id}`
            ? true
            : null"
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
            <span>Adicionar projeto a esse portfólio</span>
          </router-link>
        </details>
      </div>
    </template>
  </div>
</template>
