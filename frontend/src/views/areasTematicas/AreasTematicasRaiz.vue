<script setup>
import { onUnmounted } from 'vue';

import { useAreasTematicasStore } from '@/stores/areasTematicas.store';

const areasTematicasStore = useAreasTematicasStore();

onUnmounted(() => {
  areasTematicasStore.$reset();
});
</script>

<template>
  <router-view />
</template>
