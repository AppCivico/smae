<script setup>
import TabelaDeMensais from '@/components/relatorios/TabelaDeMensais.vue';
import { useAuthStore, useRelatoriosStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const route = useRoute();

const relatóriosStore = useRelatoriosStore();

onMounted(() => {
  relatóriosStore.clear();
  relatóriosStore.getAll({ fonte: 'MonitoramentoMensal' });
});
</script>
<template>
  <div class="flex spacebetween center mb2">
      <h1>{{ route.meta.título }}</h1>
      <hr class="ml2 f1"/>
      <!--router-link :to="{ name: 'novoRelatórioOrçamentário' }" class="btn big ml2" v-if="temPermissãoPara('Reports.executar')">
        Novo relatório
      </router-link-->
  </div>
  <!--div class="flex center mb2">
      <div class="f2 search">
          <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
      </div>
  </div-->

  <TabelaDeMensais />
</template>
