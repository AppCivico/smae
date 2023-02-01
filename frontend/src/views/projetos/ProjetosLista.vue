<script setup>
import { Dashboard } from '@/components';
import {
  useAlertStore, useOrgansStore, useProjetosStore
} from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const organsStore = useOrgansStore();
const { organs, órgãosPorId } = storeToRefs(organsStore);
const projetosStore = useProjetosStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(projetosStore);
const route = useRoute();
const alertStore = useAlertStore();

async function excluirProjetos(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await projetosStore.excluirItem(id)) {
      projetosStore.$reset();
      projetosStore.buscarTudo();
      alertStore.success('Projetos removido.');
    }
  }, 'Remover');
}

const metasPorId = {};
const statusesPorId = {};

projetosStore.$reset();
projetosStore.buscarTudo();

if (!organs.length) {
  organsStore.getAll();
}
</script>
<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <h1>{{ route?.meta?.title || 'Projetos' }}</h1>
      <hr class="ml2 f1">
      <!--router-link
        :to="{ name: 'projetosCriar' }"
        class="btn big ml1"
      >
        Novo projeto
      </router-link-->
    </div>

    <table class="tablemain">
      <col>
      <col>
      <col>
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
      <thead>
        <tr>
          <th>
            Projeto
          </th>
          <th>
            Órgão responsável
          </th>
          <th>
            Meta
          </th>
          <th>
            Status
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
          <td>{{ item.nome }}</td>
          <td>
            {{
              órgãosPorId[item.orgao_responsavel?.id]?.sigla
                || item.orgao_responsavel?.sigla
                || item.orgao_responsavel
            }}
          </td>
          <td>
            {{
              metasPorId[item.meta?.id]?.código
                || item.meta?.código
                || item.meta
            }}
          </td>
          <td>
            {{
              statusesPorId[item.status?.id]?.código
                || item.status?.código
                || item.status
            }}
          </td>
          <td>
            <button
              class="like-a__text"
              arial-label="excluir"
              title="excluir"
              @click="excluirProjetos(item.id)"
            >
              <img
                src="../../assets/icons/excluir.svg"
              >
            </button>
          </td>
          <td>
            <router-link
              :to="{ name: 'projetosEditar', params: { projetoId: item.id } }"
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
          <td colspan="6">
            Carregando
          </td>
        </tr>
        <tr v-else-if="erro">
          <td colspan="6">
            Erro: {{ erro }}
          </td>
        </tr>
        <tr v-else-if="!lista.length">
          <td colspan="6">
            Nenhum resultado encontrado.
          </td>
        </tr>
      </tbody>
    </table>
  </Dashboard>
</template>
