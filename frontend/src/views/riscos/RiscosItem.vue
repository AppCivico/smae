<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useRiscosStore } from '@/stores/riscos.store.ts';

const route = useRoute();
const riscosStore = useRiscosStore();

onMounted(() => {
  riscosStore.$reset();

  if (!riscosStore.emFoco) {
    riscosStore.buscarItem(route.params.riscoId);
  }
});
</script>
<template>
  <router-view />
</template>
