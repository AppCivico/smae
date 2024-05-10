<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useVariavelCategoriaStore } from '@/stores/variavelCategoria.store';
import { storeToRefs } from 'pinia';

const variavelCategoriaStore = useVariavelCategoriaStore();
const { lista, chamadasPendentes, erro } = storeToRefs(variavelCategoriaStore);

const alertStore = useAlertStore();

async function excluirVariavelCategoria(id) {
  alertStore.confirmAction('Deseja mesmo remover esse item?', async () => {
    if (await variavelCategoriaStore.excluirItem(id)) {
      variavelCategoriaStore.buscarTudo();
      alertStore.success('Item removido.');
    }
  }, 'Remover');
}

function ordenarListaAlfabeticamente() {
  lista.value.sort((a, b) => a.titulo.localeCompare(b.titulo));
}

variavelCategoriaStore.buscarTudo().then(ordenarListaAlfabeticamente);
</script>
<template>
  <div
    class="flex spacebetween center mb2"
  >
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'variavelCategoriaCriar' }"
      class="btn big ml2"
    >
      Nova variável de Categoria
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
          Tipo
        </th>
        <th>
          titulo
        </th>
        <th>
          Descrição
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in lista"
        :key="item.id"
      >
        <td>{{ item.tipo }}</td>
        <td>{{ item.titulo }}</td>
        <td>{{ item.descricao }}</td>
        <td>
          <button
            class="like-a__text"
            arial-label="excluir"
            title="excluir"
            @click="excluirVariavelCategoria(item.id)"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_remove" /></svg>
          </button>
        </td>
        <td>
          <router-link
            :to="{ name: 'variavelCategoriaEditar', params: { variavelCategoriaId: item.id } }"
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
