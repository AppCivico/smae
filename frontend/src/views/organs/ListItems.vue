<script setup>
import { ref, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { useAuthStore, useOrgansStore } from '@/stores';
import { useAlertStore } from '@/stores/alert.store';

const alertStore = useAlertStore();
const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const organsStore = useOrgansStore();
const { tempOrgans } = storeToRefs(organsStore);
organsStore.clear();
organsStore.filterOrgans();

const filters = reactive({
  textualSearch: '',
});
const itemsFiltered = ref(tempOrgans);

function filterItems() {
  organsStore.filterOrgans(filters);
}

async function apagarOrgao({ id, descricao }) {
  alertStore.confirmAction(
    `Deseja mesmo remover o item "${descricao}"?`,
    async () => {
      await organsStore.delete(id).then(() => {
        filterItems();
      }).catch();
    },
    'Remover',
  );
}
</script>

<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <TítuloDePágina />

      <hr class="ml2 f1">

      <router-link
        v-if="perm?.CadastroTipoOrgao"
        to="/orgaos/tipos"
        class="btn big amarelo ml2"
      >
        Gerenciar Tipos de Orgão
      </router-link>

      <router-link
        v-if="perm?.CadastroOrgao?.inserir"
        :to="{ name: 'orgaos.novo'}"
        class="btn big ml1"
      >
        Novo orgão
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
          <th style="width: 50%">
            Orgão
          </th>
          <th style="width: 20%">
            Tipo
          </th>
          <th style="width: 20%">
            Sigla
          </th>
          <th />
        </tr>
      </thead>

      <tbody>
        <template v-if="itemsFiltered.length">
          <tr
            v-for="item in itemsFiltered"
            :key="item.id"
          >
            <td>{{ item.descricao }}</td>
            <td>{{ item.tipo_orgao.descricao }}</td>
            <td>{{ item.sigla ?? '-' }}</td>
            <td class="tr">
              <template v-if="perm?.CadastroOrgao?.editar">
                <router-link
                  :to="{
                    name: 'orgaos.editar',
                    params: {
                      id: item.id
                    }
                  }"
                  class="tprimary"
                >
                  <svg
                    width="20"
                    height="20"
                  ><use xlink:href="#i_edit" /></svg>
                </router-link>

                <button
                  type="button"
                  class="ml1 like-a__text"
                  aria-label="apagar"
                  @click="apagarOrgao(item)"
                >
                  <svg
                    width="20"
                    height="20"
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
