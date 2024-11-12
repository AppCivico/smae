<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { usePaineisExternosStore } from '@/stores/paineisExternos.store';
import truncate from '@/helpers/truncate';

const portfolioStore = usePaineisExternosStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(portfolioStore);
const route = useRoute();
const alertStore = useAlertStore();

async function excluirPainel(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await portfolioStore.excluirItem(id)) {
      portfolioStore.$reset();
      portfolioStore.buscarTudo();
      alertStore.success('Portfólio removido.');
    }
  }, 'Remover');
}

portfolioStore.$reset();
portfolioStore.buscarTudo();

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Paineis externos' }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{name: 'paineisExternosCriar'}"
      class="btn big ml1"
    >
      Novo painel externo
    </router-link>
  </div>

  <table class="tablemain">
    <col>
    <col>
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>
          Nome
        </th>
        <th>
          Descrição
        </th>
        <th>
          Link
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
          {{ truncate(item.descricao, 36) }}
        </td>
        <td>
          <a
            v-if="item.link"
            :href="item.link"
            target="_blank"
          >
            {{ truncate(item.link, 36) }}
          </a>
        </td>
        <td>
          <SmaeLink
            :to="{ name: 'paineisExternosEditar', params: { painelId: item.id } }"
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
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirPainel(item.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
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
