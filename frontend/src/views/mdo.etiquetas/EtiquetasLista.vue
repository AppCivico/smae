<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

import { useAlertStore } from '@/stores/alert.store';
import { useEtiquetasStore } from '@/stores/etiquetaMdo.store';

const route = useRoute();
const alertStore = useAlertStore();
const etiquetasStore = useEtiquetasStore();
const { lista, chamadasPendentes, erro } = storeToRefs(etiquetasStore);

async function excluirEtiqueta(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await etiquetasStore.excluirItem(id)) {
        etiquetasStore.$reset();
        etiquetasStore.buscarTudo({ pdm_id: route.params.planoSetorialId });
        alertStore.success(`"${descricao}" removida.`);
      }
    },
    'Remover',
  );
}

etiquetasStore.$reset();
etiquetasStore.buscarTudo();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <router-link
      :to="{ name: 'mdoEtiquetas.criar' }"
      class="btn big ml1"
    >
      Nova etiqueta
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
        <th>Etiqueta</th>
        <th />
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>{{ item.descricao }}</td>
        <td>
          <router-link
            :to="{ name: 'mdoEtiquetas.editar', params: { etiquetaId: item.id } }"
            class="tprimary"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_edit" /></svg>
          </router-link>
        </td>
        <td>
          <button
            class="like-a__text"
            aria-label="excluir"
            title="excluir"
            @click="excluirEtiqueta(item.id, item.descricao)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_waste" /></svg>
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

<style></style>
