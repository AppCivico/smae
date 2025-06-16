<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useSituacaoStore } from '@/stores/situacao.store.js';
import { storeToRefs } from 'pinia';

const situacaoStore = useSituacaoStore();
const { lista, chamadasPendentes, erro} = storeToRefs(situacaoStore);

const alertStore = useAlertStore();

async function excluirSituacao(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await situacaoStore.excluirItem(id)) {
      situacaoStore.buscarTudo();
      alertStore.success('Item removido.');
    }
  }, 'Remover');
}

function ordenarListaAlfabeticamente() {
  lista.value.sort((a, b) => a.situacao.localeCompare(b.situacao));
}

situacaoStore.buscarTudo().then(ordenarListaAlfabeticamente);
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'situacaoCriar' }"
      class="btn big ml2"
    >
      Nova situação
    </router-link>
  </div>

  <table class="tablemain">
    <colgroup>
      <col>
      <col class="col--botão-de-ação">
      <col class="col--botão-de-ação">
    </colgroup>
    <thead>
      <tr>
        <th>
          Situação
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>{{ item.situacao }}</td>
        <td>
          <button
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirSituacao(item.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
        <td>
          <router-link
            :to="{ name: 'situacaoEditar', params: { situacaoId: item.id } }"
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

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
