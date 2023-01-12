<script setup>
import TabelaDeMensais from '@/components/relatorios/TabelaDeMensais.vue';
import {
  useAuthStore, usePaineisStore, useRelatoriosStore
} from '@/stores';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const route = useRoute();

const PainéisStore = usePaineisStore();
const relatóriosStore = useRelatoriosStore();

onMounted(() => {
  PainéisStore.getAll();
  relatóriosStore.clear();
  relatóriosStore.getAll({ fonte: 'MonitoramentoMensal' });
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar')"
      :to="{ name: 'novoRelatórioMensal' }"
      class="btn big ml2"
    >
      Novo relatório
    </router-link>
  </div>
  <!--div class="flex center mb2">
    <div class="f2 search">
      <input
        v-model="filters.textualSearch"
        placeholder="Buscar"
        type="text"
        class="inputtext"
        @input="filterItems"
      >
    </div>
  </div-->

  <TabelaDeMensais />
</template>
