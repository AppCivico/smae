<script setup>
import statuses from '@/consts/statuses';
import {
  useAlertStore, useProjetosStore
} from '@/stores';

const alertStore = useAlertStore();
const projetosStore = useProjetosStore();

const props = defineProps({
  erro: {
    type: Object,
    default() {
      return null;
    },
  },
  lista: {
    type: Array,
    default() {
      return [];
    },
  },
  pendente: {
    type: Boolean,
    default: true,
  },
});

const metasPorId = {};

async function excluirProjetos(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await projetosStore.excluirItem(id)) {
      projetosStore.$reset();
      projetosStore.buscarTudo();
      alertStore.success('Projetos removido.');
    }
  }, 'Remover');
}
</script>
<template>
  <table class="tablemain">
    <colgroup>
      <col>
      <col>
      <col>
      <col>
      <!--col class="col--botão-de-ação"-->
      <col class="col--botão-de-ação">
    </colgroup>
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
        <!--th /-->
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in props.lista"
        :key="item.id"
      >
        <td>
          <router-link
            :to="{
              name: 'projetosResumo',
              params: {
                projetoId: item.id,
                portfolioId: item.portfolio.id || item.portfolio,
              }
            }"
          >
            {{ item.nome }}
          </router-link>
        </td>
        <td
          :title="item.orgao_responsavel?.descricao"
        >
          {{ item.orgao_responsavel?.sigla }}
        </td>
        <td>
          {{
            metasPorId[item.meta?.id]?.codigo
              || item.meta?.codigo
              || item.meta
          }}
        </td>
        <td>
          {{ statuses[item.status] || item.status }}
        </td>
        <!--td>
          <button
            class="like-a__text addlink"
            arial-label="excluir"
            title="excluir"
            @click="excluirProjetos(item.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td-->
        <td>
          <router-link
            v-if="!item.arquivado"
            :to="{
              name: 'projetosEditar',
              params: {
                projetoId: item.id,
                portfolioId: item.portfolio.id || item.portfolio,
              }
            }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
      </tr>
      <tr v-if="pendente">
        <td colspan="5">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td colspan="5">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td colspan="5">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
