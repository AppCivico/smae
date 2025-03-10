<script setup>
import statuses from '@/consts/projectStatuses';
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

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

</script>
<template>
  <table class="tablemain">
    <colgroup>
      <col>
      <col>
      <col>
      <col>
      <col
        v-if="temPermissãoPara('Projeto.administrador_no_orgao')"
        class="col--botão-de-ação"
      >
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
        <th v-if="temPermissãoPara('Projeto.administrador_no_orgao')" />
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
                projetoId: item.id
              }
            }"
          >
            <strong v-if="item.codigo">
              {{ item.codigo }} -
            </strong>
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
          {{ statuses[item.status]?.nome || item.status }}
        </td>
        <td v-if="temPermissãoPara('Projeto.administrador_no_orgao')">
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
        <td :colspan="temPermissãoPara('Projeto.administrador_no_orgao') ? 5 : 4">
          Carregando
        </td>
      </tr>
      <tr v-else-if="erro">
        <td :colspan="temPermissãoPara('Projeto.administrador_no_orgao') ? 5 : 4">
          Erro: {{ erro }}
        </td>
      </tr>
      <tr v-else-if="!lista.length">
        <td :colspan="temPermissãoPara('Projeto.administrador_no_orgao') ? 5 : 4">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
