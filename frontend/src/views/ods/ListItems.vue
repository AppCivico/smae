<script setup>
import { storeToRefs } from 'pinia';
import { reactive, ref } from 'vue';

import { Dashboard } from '@/components';
import TituloDaPagina from '@/components/TituloDaPagina.vue';

import { useAlertStore, useAuthStore, useODSStore } from '@/stores';

const ODSStore = useODSStore();
const authStore = useAuthStore();
const alertStore = useAlertStore();

const { tempODS } = storeToRefs(ODSStore);
const { permissions } = storeToRefs(authStore);

ODSStore.clear();
ODSStore.filterODS();
const perm = permissions.value;

const filters = reactive({
  textualSearch: '',
});
const itemsFiltered = ref(tempODS);

function filterItems() {
  ODSStore.filterODS(filters);
}

async function checkDelete({ id, titulo }) {
  alertStore.confirmAction(`Deseja mesmo remover o item "${titulo}"?`, async () => {
    ODSStore.delete(id).then(() => {
      ODSStore.clear();
      ODSStore.filterODS(filters);
    }).catch(() => { });
  }, 'Remover');
}
</script>

<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <TituloDaPagina />

      <hr class="ml2 f1">

      <router-link
        v-if="perm?.CadastroOds?.inserir"
        :to="{ name: 'categorias.novo'}"
        class="btn big ml2"
      >
        Nova categoria de tags
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
            <td class="tr">
              <router-link
                v-if="perm?.CadastroOds?.editar"
                :to="{
                  name: 'categorias.editar',
                  params: {
                    id: item.id
                  }
                }"
                class="tprimary"
              >
                <svg
                  width="20"
                  height="20"
                >
                  <use xlink:href="#i_edit" />
                </svg>
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
                >
                  <use xlink:href="#i_waste" />
                </svg>
              </button>
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
