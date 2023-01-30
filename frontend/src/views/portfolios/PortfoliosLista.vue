<script setup>
import { Dashboard } from '@/components';
import { useOrgansStore, usePortfolioStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const portfolioStore = usePortfolioStore();
const { lista, chamadasPendentes, erro } = storeToRefs(portfolioStore);
const organsStore = useOrgansStore();
const { organs, órgãosPorId } = storeToRefs(organsStore);
const route = useRoute();

portfolioStore.$reset();
portfolioStore.buscarTudo();

if (!organs.length) {
  organsStore.getAll();
}
</script>
<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <h1>{{ route?.meta?.title || 'Portfolios' }}</h1>
      <hr class="ml2 f1">
    </div>
    <table class="tablemain">
      <col style="width: 50%">
      <col style="width: 20%">
      <col class="col--botão-de-ação">
      <thead>
        <tr>
          <th>
            Portfolio
          </th>
          <th>
            Órgãos
          </th>
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
            <router-link
              v-for="órgão in item.orgaos"
              :key="órgão.id"
              :title="órgãosPorId[órgão.id]?.descricao"
              :to="{
                name: 'ÓrgãosItem',
                params: {
                  id: órgão.id
                }
              }"
            >
              {{ órgãosPorId[órgão.id]?.sigla || órgão.id }}
            </router-link>
          </td>
          <td>
            <template v-if="perm?.CadastroOrgao?.editar">
              <router-link
                :to="`/portfolios/${item.id}`"
                class="tprimary"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </router-link>
            </template>
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
  </Dashboard>
</template>
