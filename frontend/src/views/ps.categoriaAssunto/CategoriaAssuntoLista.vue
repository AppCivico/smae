<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <SmaeLink
      :to="{ name: 'categoriaAssuntosCriar' }"
      class="btn big ml1"
    >
      Nova categoria de assunto
    </SmaeLink>
  </div>
  <div class="flex center mb2 spacebetween">
    <LocalFilter
      v-model="listaFiltradaPorTermoDeBusca"
      :lista="categorias"
      class="mr1"
    />
    <hr class="ml2 f1">
  </div>
  <table class="tablemain">
    <col>
    <col class="col--botão-de-ação">
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th> Nome </th>
        <th />
        <th />
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in listaFiltradaPorTermoDeBusca"
        :key="item.id"
      >
        <td>{{ item.nome }}</td>
        <td>
          <router-link
            :to="{
              name: 'categoriaAssuntosEditar',
              params: { categoriaAssuntoId: item.id }
            }"
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
import { useAlertStore } from '@/stores/alert.store';
import { useAssuntosStore } from '@/stores/assuntosPs.store';
import LocalFilter from '@/components/LocalFilter.vue';
import SmaeLink from '@/components/SmaeLink.vue';

const alertStore = useAlertStore();
const assuntosStore = useAssuntosStore();
const { categorias, chamadasPendentes, erro } = storeToRefs(assuntosStore);

const listaFiltradaPorTermoDeBusca = ref([]);

async function excluirAssunto(id, descricao) {
  alertStore.confirmAction(
    `Deseja mesmo remover "${descricao}"?`,
    async () => {
      if (await assuntosStore.excluirCategoria(id)) {
        assuntosStore.$reset();
        assuntosStore.buscarCategorias();
        alertStore.success(`"${descricao}" removido.`);
      }
    },
    'Remover',
  );
}

assuntosStore.$reset();
assuntosStore.buscarCategorias();
</script>

<style></style>
