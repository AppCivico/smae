<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const organsStore = useOrgansStore();
const { organs, órgãosPorId } = storeToRefs(organsStore);
const portfolioStore = usePortfolioStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(portfolioStore);
const route = useRoute();
const alertStore = useAlertStore();

async function excluirPortfolio(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await portfolioStore.excluirItem(id)) {
      portfolioStore.$reset();
      portfolioStore.buscarTudo({}, false);
      alertStore.success('Portfólio removido.');
    }
  }, 'Remover');
}

portfolioStore.$reset();
portfolioStore.buscarTudo({}, false);

if (!organs.length) {
  organsStore.getAll();
}

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Portfolios' }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'portfoliosCriar' }"
      class="btn big ml1"
    >
      Novo portfólio
    </router-link>
  </div>

  <table class="tablemain">
    <col>
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>
          Portfólio
        </th>
        <th>
          Órgãos
        </th>
        <th>
          Modelo de clonagem
        </th>
        <th />
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>{{ item.titulo }}</td>
        <td>
          {{ item.orgaos.map((x) => órgãosPorId[x.id]?.sigla || x.id).join(', ') }}
        </td>
        <td>{{ item.modelo_clonagem ? 'Sim' : 'Não' }}</td>
        <td>
          <button
            v-if="item?.pode_editar"
            class="like-a__text"
            aria-label="excluir"
            title="excluir"
            @click="excluirPortfolio(item.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
        <td>
          <router-link
            v-if="item?.pode_editar"
            :to="{ name: 'portfoliosEditar', params: { portfolioId: item.id } }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="3">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="3">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="3">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
