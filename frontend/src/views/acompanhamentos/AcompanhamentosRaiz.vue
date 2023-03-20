<script setup>
import { useRiscosStore } from '@/stores/riscos.store.ts';

const riscosStore = useRiscosStore();

if (!riscosStore?.lista?.length) {
  riscosStore?.buscarTudo();
}
</script>
<template>
  <router-view />
</template>
