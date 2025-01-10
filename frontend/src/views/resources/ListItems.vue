<script setup>
import { ref, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { useAlertStore, useAuthStore, useResourcesStore } from '@/stores';

const authStore = useAuthStore();
const alertStore = useAlertStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const resourcesStore = useResourcesStore();
const { tempResources } = storeToRefs(resourcesStore);
resourcesStore.clear();
resourcesStore.filterResources();

const filters = reactive({
  textualSearch: '',
});
const itemsFiltered = ref(tempResources);

function filterItems() {
  resourcesStore.filterResources(filters);
}

async function checkDelete({ id, descricao }) {
  alertStore.confirmAction(`Deseja mesmo remover esse o item "${descricao}"?`, async (a) => {
    resourcesStore.deleteType(id).then(() => {
      resourcesStore.clear();
      resourcesStore.filterResources();
    }).catch(() => {});
  }, 'Remover');
}
</script>

<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <h1>Unidades de medida</h1>

      <hr class="ml2 f1">

      <router-link
        v-if="perm?.CadastroUnidadeMedida?.inserir"
        to="/unidade-medida/novo"
        class="btn big ml2"
      >
        Nova unidade de Medida
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
          <th style="width: 45%">
            Descrição
          </th>
          <th style="width: 45%">
            Sigla
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
            <td>{{ item.descricao }}</td>
            <td>{{ item.sigla }}</td>
            <td class="tr">
              <template v-if="perm?.CadastroUnidadeMedida?.editar">
                <router-link
                  :to="`/unidade-medida/editar/${item.id}`"
                  class="tprimary"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_edit" /></svg>
                </router-link>

                <button
                  v-if="perm?.CadastroUnidadeMedida.remover"
                  class="ml1 like-a__text"
                  @click="checkDelete(item)"
                >
                  <svg
                    width="20"
                    height="20"
                    class="blue"
                  ><use xlink:href="#i_waste" /></svg>
                </button>
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
  </Dashboard>
</template>
