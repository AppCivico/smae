<script setup>
import { useAuthStore, useODSStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { reactive, ref } from 'vue';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const ODSStore = useODSStore();
const { tempODS } = storeToRefs(ODSStore);
ODSStore.clear();
ODSStore.filterODS();

const filters = reactive({
  textualSearch: '',
});
const itemsFiltered = ref(tempODS);

function filterItems() {
  ODSStore.filterODS(filters);
}
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>Categorias</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="perm?.CadastroOds?.inserir"
      to="/categorias/nova"
      class="btn big ml2"
    >
      Nova categoria
    </router-link>
  </div>
  <div class="flex center mb2">
    <div class="f2 search">
      <input
        v-model="filters.textualSearch"
        placeholder="Buscar"
        type="text"
        class="inputtext"
        @input="filterItems"
      >
    </div>
  </div>

  <table class="tablemain">
    <thead>
      <tr>
        <th style="width: 10%">
          Número
        </th>
        <th style="width: 35%">
          Título
        </th>
        <th style="width: 45%">
          Descrição
        </th>
        <th style="width: 10%" />
      </tr>
    </thead>
    <tbody>
      <template v-if="itemsFiltered.length">
        <tr
          v-for="item in itemsFiltered"
          :key="item.id"
        >
          <td>{{ item.numero }}</td>
          <td>{{ item.titulo }}</td>
          <td>{{ item.descricao }}</td>
          <td style="white-space: nowrap; text-align: right;">
            <template v-if="perm?.CadastroOds?.editar">
              <router-link
                :to="`/categorias/editar/${item.id}`"
                class="tprimary"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </router-link>
            </template>
          </td>
        </tr>
      </template>
      <tr v-else-if="itemsFiltered.loading">
        <td colspan="54">
          Carregando
        </td>
      </tr>
      <tr v-else-if="itemsFiltered.error">
        <td colspan="54">
          Error: {{ itemsFiltered.error }}
        </td>
      </tr>
      <tr v-else>
        <td colspan="54">
          Nenhum resultado encontrado.
        </td>
      </tr>
    </tbody>
  </table>
</template>
