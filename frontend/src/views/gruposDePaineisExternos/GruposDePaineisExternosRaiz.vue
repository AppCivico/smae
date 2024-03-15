<script setup>
import { useGruposPaineisExternos } from '@/stores/grupospaineisExternos.store.ts';
import { onUnmounted } from 'vue';

onUnmounted(() => { useGruposPaineisExternos().$reset(); });
</script>
<template>
  <router-view />
</template>
