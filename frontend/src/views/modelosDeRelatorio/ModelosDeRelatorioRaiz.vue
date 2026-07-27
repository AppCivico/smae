<script setup>
import { onUnmounted } from 'vue';

import { useAuthStore } from '@/stores/auth.store';
import { useModelosDeRelatorioStore } from '@/stores/modelosDeRelatorio.store';

const { sistemaEscolhido } = useAuthStore();
const modelosDeRelatorioStore = useModelosDeRelatorioStore(sistemaEscolhido);

onUnmounted(() => {
  modelosDeRelatorioStore.$reset();
});
</script>

<template>
  <router-view />
</template>
