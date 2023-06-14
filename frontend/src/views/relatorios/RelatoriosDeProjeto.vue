<script setup>
import TabelaBásica from '@/components/relatorios/TabelaBasica.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

const relatóriosStore = useRelatoriosStore();
const { temPermissãoPara } = storeToRefs(useAuthStore());

onMounted(() => {
  relatóriosStore.$reset();
  relatóriosStore.getAll({ fonte: 'Projeto' });
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar')"
      :to="{ name: 'novoRelatórioDeProjeto' }"
      class="btn big ml2"
    >
      Novo relatório
    </router-link>
  </div>

  <TabelaBásica />
</template>
