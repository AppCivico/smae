<script setup>
import TabelaDeSemestraisOuAnuais from '@/components/relatorios/TabelaDeSemestraisOuAnuais.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const route = useRoute();

const relatóriosStore = useRelatoriosStore();

onMounted(() => {
  relatóriosStore.$reset();
  relatóriosStore.getAll({ fonte: 'Indicadores' });
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar')"
      :to="{ name: 'novoRelatórioSemestralOuAnual' }"
      class="btn big ml2"
    >
      Novo relatório
    </router-link>
  </div>
  <!--div class="flex center mb2">
      <div class="f2 search">
          <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
      </div>
  </div-->

  <TabelaDeSemestraisOuAnuais />
</template>
