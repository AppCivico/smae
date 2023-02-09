<script setup>
import {
useAlertStore, useOrgansStore, useProjetosStore
} from '@/stores';
import { storeToRefs } from 'pinia';

const alertStore = useAlertStore();
const projetosStore = useProjetosStore();
const organsStore = useOrgansStore();
const { órgãosPorId } = storeToRefs(organsStore);

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
const statusesPorId = {};

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
    <col>
    <col>
    <col>
    <col>
    <!--col class="col--botão-de-ação"-->
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
          <router-link :to="{ name: 'projetosResumo', params: { projetoId: item.id }}">
            {{ item.nome }}
          </router-link>
        </td>
        <td>
          {{
            órgãosPorId[item.orgao_responsavel?.id]?.sigla
              || item.orgao_responsavel?.sigla
              || item.orgao_responsavel
          }}
        </td>
        <td>
          {{
            metasPorId[item.meta?.id]?.codigo
              || item.meta?.codigo
              || item.meta
          }}
        </td>
        <td>
          {{
            statusesPorId[item.status?.id]?.codigo
              || item.status?.codigo
              || item.status
          }}
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
