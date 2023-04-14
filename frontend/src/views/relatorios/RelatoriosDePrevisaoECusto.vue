<script setup>
import TabelaBásica from '@/components/relatorios/TabelaBasica.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

const relatóriosStore = useRelatoriosStore();
const { temPermissãoPara } = storeToRefs(useAuthStore());

onMounted(() => {
  relatóriosStore.clear();
  relatóriosStore.getAll({ fonte: 'PrevisaoCusto' });
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
  </div>

  <TabelaBásica />
</template>
