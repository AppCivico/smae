<script setup>
import { storeToRefs } from 'pinia';
import { reactive, ref } from 'vue';
import { Dashboard } from '@/components';
import {
  useAlertStore,
  useAuthStore,
  useDocumentTypesStore,
} from '@/stores';

import TituloDaPagina from '@/components/TituloDaPagina.vue';

const authStore = useAuthStore();
const alertStore = useAlertStore();
const documentTypesStore = useDocumentTypesStore();

const { permissions } = storeToRefs(authStore);
const { tempDocumentTypes } = storeToRefs(documentTypesStore);

const perm = permissions.value;

documentTypesStore.clear();
documentTypesStore.filterDocumentTypes();

const filters = reactive({
  textualSearch: '',
});
const itemsFiltered = ref(tempDocumentTypes);

async function checkDelete({ id, descricao }) {
  alertStore.confirmAction(`Deseja mesmo remover o item "${descricao}"?`, async () => {
    documentTypesStore.delete(id).then(() => {
      documentTypesStore.clear();
      documentTypesStore.filterDocumentTypes(filters);
    }).catch(() => { });
  }, 'Remover');
}

function filterItems() {
  documentTypesStore.filterDocumentTypes(filters);
}
</script>

<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <TituloDaPagina />

      <hr class="ml2 f1">

      <router-link
        v-if="perm?.CadastroTipoDocumento?.inserir"
        :to="{ name: 'tipo-documento.novo' }"
        class="btn big ml2"
      >
        Novo Tipo de Documento
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
            Código
          </th>
          <th style="width: 25%">
            Tipo
          </th>
          <th style="width: 35%">
            Descrição
          </th>
          <th style="width: 20%">
            Extensões
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
            <td>{{ item.codigo }}</td>
            <td>{{ item.titulo }}</td>
            <td>{{ item.descricao }}</td>
            <td>{{ item.extensoes.split(',').join(', ') }}</td>
            <td class="tr">
              <router-link
                v-if="perm?.CadastroTipoDocumento?.editar"
                :to="{
                  name: 'tipo-documento.editar',
                  params: { id: item.id }
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
