<script setup>
import { onUnmounted } from 'vue';

import { useGruposPaineisExternos } from '@/stores/grupospaineisExternos.store.ts';

onUnmounted(() => { useGruposPaineisExternos().$reset(); });
</script>
<template>
  <router-view />
</template>
