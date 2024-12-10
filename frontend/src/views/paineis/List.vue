<script setup>
import { Dashboard } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { useMetasStore } from '@/stores/metas.store';
import { usePaineisStore } from '@/stores/paineis.store';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;

const PaineisStore = usePaineisStore();
const { tempPaineis } = storeToRefs(PaineisStore);
PaineisStore.clear();
PaineisStore.filterPaineis();

const MetasStore = useMetasStore();
const { activePdm, Metas } = storeToRefs(MetasStore);

async function iniciar() {
  if (!activePdm.value.id) {
    await MetasStore.getPdM();
  }

  MetasStore.getAll();
}

const filters = ref({
  textualSearch: '',
});
const itemsFiltered = ref(tempPaineis);

function filterItems() {
  PaineisStore.filterPaineis(filters.value);
}

iniciar();
</script>
<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <h1>Painéis de metas</h1>
      <hr class="ml2 f1">
      <router-link
        v-if="perm?.CadastroPainel?.inserir"
        to="/paineis/novo"
        class="btn big ml2"
      >
        Novo Modelo
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
            Nome
          </th>
          <th style="width: 15%">
            Status
          </th>
          <th style="width: 15%">
            Periodicidade
          </th>
          <th
            style="width: 15%"
            class="tr"
          >
            Metas monitoradas
          </th>
          <th style="width: 10%" />
        </tr>
      </thead>
      <tbody>
        <template v-if="itemsFiltered.length">
          <tr
            v-for="p in itemsFiltered"
            :key="p.id"
          >
            <td>{{ p.nome }}</td>
            <td>{{ p.ativo?"Ativo":"Inativo" }}</td>
            <td>{{ p.periodicidade }}</td>
            <td class="tr">
              {{ p.painel_conteudo.length }} de {{ Metas.length }}
            </td>
            <td style="white-space: nowrap; text-align: right">
              <router-link
                v-if="perm?.CadastroPainel?.editar"
                :to="`/paineis/${p.id}`"
                class="tprimary"
              >
                <svg
                  width="20"
                  height="20"
                ><use xlink:href="#i_edit" /></svg>
              </router-link>
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
