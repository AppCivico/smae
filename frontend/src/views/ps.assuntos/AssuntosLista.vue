<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'assunto.novo' }"
      class="btn big ml1"
    >
      Novo assunto
    </router-link>
  </div>
  <div class="flex center mb2 spacebetween">
    <LocalFilter
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="lista"
      class="mr1"
    />
    <hr class="ml2 f1">
  </div>
  <table class="tablemain">
    <col>
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th> Nome </th>
        <th> Categoria </th>
        <th />
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in listaFiltradaPorTermoDeBusca"
        :key="item.id"
      >
        <td>
          {{ item.nome }}
        </td>
        <td>
          {{ item.categoria_assunto_variavel ? item.categoria_assunto_variavel.nome : '-' }}
        </td>
        <td>
          <router-link
            :to="{ name: 'assunto.editar', params: { assuntoId: item.id } }"
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
            arial-label="excluir"
            title="excluir"
            @click="excluirAssunto(item.id, item.nome)"
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
      <tr v-else-if="!listaFiltradaPorTermoDeBusca.length">
        <td colspan="3">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useAlertStore } from '@/stores/alert.store';
import { useAssuntosStore } from '@/stores/assuntosPs.store';
import LocalFilter from '@/components/LocalFilter.vue';

const route = useRoute();

const alertStore = useAlertStore();
const assuntosStore = useAssuntosStore();
const { lista, chamadasPendentes, erro } = storeToRefs(assuntosStore);
const listaFiltradaPorTermoDeBusca = ref([]);

async function excluirAssunto(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await assuntosStore.excluirItem(id)) {
        assuntosStore.$reset();
        assuntosStore.buscarTudo({ pdm_id: route.params.planoSetorialId });
        alertStore.success(`"${descricao}" removido.`);
      }
    },
    'Remover',
  );
}

assuntosStore.$reset();
assuntosStore.buscarTudo();
</script>

<style></style>
