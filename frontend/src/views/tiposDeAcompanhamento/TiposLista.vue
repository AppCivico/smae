<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import TabelaGenérica from '@/components/TabelaGenerica.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useTiposDeAcompanhamentoStore } from '@/stores/tiposDeAcompanhamento.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const tiposDeAcompanhamentoStore = useTiposDeAcompanhamentoStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(tiposDeAcompanhamentoStore);

const alertStore = useAlertStore();

async function excluirTipo(id) {
  alertStore.confirmAction('Todos os acompanhamentos associados perderão seu tipo. Deseja mesmo remover esse item?', async () => {
    if (await tiposDeAcompanhamentoStore.excluirItem(id)) {
      tiposDeAcompanhamentoStore.buscarTudo();
      alertStore.success('Tipo removido.');
    }
  }, 'Remover');
}

const colunas = [
  {
    nomeDaPropriedade: 'nome',
  },
  {
    nomeDaPropriedade: 'editar',
    texto: 'editar',
    svgId: 'edit',
    classe: 'col--botão-de-ação',
  },
  {
    nomeDaPropriedade: 'excluir',
    texto: 'excluir',
    svgId: 'remove',
    classe: 'col--botão-de-ação',
  },
];
const listaFiltradaPorTermoDeBusca = ref([]);

const listaPreparada = computed(() => lista.value.map((x) => ({
  nome: x.nome,
  editar: {
    rota: {
      name: 'tipoDeAcompanhamentoEditar',
      params: {
        tipoDeAtendimentoId: x.id,
      },
    },
  },
  excluir: {
    ação: () => excluirTipo(x.id),
  },
})) || []);
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="perm?.Projeto?.administrar_portfolios"
      :to="{ name: 'tipoDeAcompanhamentoCriar' }"
      class="btn big ml2"
    >
      Novo tipo
    </router-link>
  </div>

  <div class="flex center mb2 spacebetween">
    <slot name="filtro" />

    <LocalFilter
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="listaPreparada"
    />
  </div>

  <TabelaGenérica
    v-if="!chamadasPendentes.lista || lista.length"
    :lista="listaFiltradaPorTermoDeBusca"
    :colunas="colunas"
    :erro="erro"
    :chamadas-pendentes="chamadasPendentes"
    class="mb1"
  />

  <div
    v-if="chamadasPendentes?.lista"
    class="spinner"
  >
    Carregando
  </div>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
