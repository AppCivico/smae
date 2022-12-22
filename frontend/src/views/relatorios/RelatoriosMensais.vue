<script setup>
import { useAuthStore, useRelatoriosStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { reactive, ref } from 'vue';

const authStore = useAuthStore();
const { permissions } = storeToRefs(authStore);
const perm = permissions.value;
import { useRoute } from 'vue-router';

const route = useRoute();

const relatoriosStore = useRelatoriosStore();
const { tempRelatoriosTypes } = storeToRefs(relatoriosStore);
relatoriosStore.clear();
relatoriosStore.filterRelatorios();

const filters = reactive({
  textualSearch: ""
});
let itemsFiltered = ref(tempRelatoriosTypes);

function filterItems() {
  relatoriosStore.filterRelatorios(filters);
}
</script>
<template>
  <div class="flex spacebetween center mb2">
      <h1>{{ route.meta.título }}</h1>
      <hr class="ml2 f1"/>
      <router-link to="./novo" class="btn big ml2" v-if="perm?.CadastroTipoRelatorioso?.inserir">Novo relatório</router-link>
  </div>
  <div class="flex center mb2">
      <div class="f2 search">
          <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
      </div>
  </div>
</template>
