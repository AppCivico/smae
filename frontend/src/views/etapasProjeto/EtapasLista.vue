<script setup>
import LocalFilter from '@/components/LocalFilter.vue';
import TabelaGenérica from '@/components/TabelaGenerica.vue';
import { useRoute } from 'vue-router';
import { useAlertStore } from '@/stores/alert.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';

const route = useRoute();
const authStore = useAuthStore();
const { temPermissãoPara } = authStore;
const etapasProjetosStore = useEtapasProjetosStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(etapasProjetosStore);

const alertStore = useAlertStore();

async function excluirEtapa(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await etapasProjetosStore.excluirItem(id)) {
      etapasProjetosStore.buscarTudo();
      alertStore.success('Etapa removida.');
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

const listaPreparada = computed(() => {
  const listaOrdenada = lista.value.map((x) => {
    const item = {
      nome: x.descricao,
    };

    if (temPermissãoPara('CadastroProjetoEtapa.editar')) {
      item.editar = {
        rota: {
          name: 'novaEtapaDoProjetoEditar',
          params: {
            etapaDoProjetoId: x.id,
          },
        },
      };
    }

    if (route.meta.prefixoParaFilhas === 'TransferenciasVoluntarias') {
      item.editar = {
        rota: {
          name: 'etapasEditar',
          params: {
            etapaId: x.id,
          },
        },
      };
    }

    if (temPermissãoPara('CadastroProjetoEtapa.remover') || route.meta.prefixoParaFilhas === 'TransferenciasVoluntarias') {
      item.excluir = {
        ação: () => excluirEtapa(x.id),
      };
    }

    return item;
  });

  listaOrdenada.sort((a, b) => {
    const nomeA = a.nome.toLowerCase();
    const nomeB = b.nome.toLowerCase();
    if (nomeA < nomeB) {
      return -1;
    }
    if (nomeA > nomeB) {
      return 1;
    }
    return 0;
  });

  return listaOrdenada;
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('CadastroProjetoEtapa.inserir') || $route.meta.prefixoParaFilhas === 'TransferenciasVoluntarias'"
      :to="{ name: $route.meta.prefixoParaFilhas === 'TransferenciasVoluntarias' ? 'etapasCriar' : 'etapaDoProjetoCriar' }"
      class="btn big ml2"
    >
      Nova etapa
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
