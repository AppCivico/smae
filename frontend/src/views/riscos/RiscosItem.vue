<script setup>
import { useRiscosStore } from '@/stores/riscos.store.ts';

const riscosStore = useRiscosStore();
const props = defineProps({
  riscoId: {
    type: Number,
    default: 0,
  },
});

if (riscosStore.emFoco?.id !== props.riscoId) {
  riscosStore.$reset();

  riscosStore.buscarItem(props.riscoId);
}
</script>
<template>
  <router-view />
</template>
