<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useAlertStore } from '@/stores/alert.store';
import { useOrgansStore } from '@/stores/organs.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store.ts';

const organsStore = useOrgansStore();
const { organs, órgãosPorId } = storeToRefs(organsStore);
const portfolioStore = usePortfolioObraStore();
const { lista, chamadasPendentes, erro } = storeToRefs(portfolioStore);
const route = useRoute();
const alertStore = useAlertStore();

async function excluirPortfolio(id, title) {
  alertStore.confirmAction(
    `Deseja mesmo remover o portfólio "${title}"?`,
    async () => {
      if (await portfolioStore.excluirItem(id)) {
        portfolioStore.$reset();
        portfolioStore.buscarTudo({}, false);
        alertStore.success('Portfólio removido.');
      }
    },
    'Remover',
  );
}

portfolioStore.$reset();
portfolioStore.buscarTudo({}, false);

if (!organs.length) {
  organsStore.getAll();
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || "Portfolios" }}</h1>
    <hr class="ml2 f1">
    <SmaeLink
      :to="{ name: 'mdo.portfolio.criar' }"
      class="btn big ml1"
    >
      Novo portfólio
    </SmaeLink>
  </div>

  <table class="tablemain">
    <col>
    <col>
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>Portfólio</th>
        <th>Órgãos</th>
        <th>Modelo de clonagem</th>
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
          {{
            item.orgaos.map((x) => órgãosPorId[x.id]?.sigla || x.id).join(", ")
          }}
        </td>
        <td>{{ item.modelo_clonagem ? "Sim" : "Não" }}</td>
        <td>
          <SmaeLink
            v-if="item?.pode_editar"
            :to="{
              name: '.portfolio.editar',
              params: { portfolioId: item.id },
            }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </SmaeLink>
        </td>
        <td>
          <button
            v-if="item?.pode_editar"
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirPortfolio(item.id, item.titulo)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
      </tr>
      <tr v-if="chamadasPendentes.lista">
        <td colspan="5">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro.lista">
        <td colspan="5">
          Erro: {{ erro.lista }}
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
