<script setup>
import TabelaDeOrçamentários from '@/components/relatorios/TabelaDeOrcamentarios.vue';
import { useAuthStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const route = useRoute();


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

  <TabelaDeOrçamentários />
</template>
