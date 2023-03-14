<script setup>
import { usePlanosDeAçãoStore } from '@/stores/planosDeAcao.store.ts';

const planosDeAçãoStore = usePlanosDeAçãoStore();
const props = defineProps({
  planoId: {
    type: Number,
    default: 0,
  },
});

if (planosDeAçãoStore.emFoco?.id !== props.planoId) {
  planosDeAçãoStore.$reset();

  planosDeAçãoStore.buscarItem(props.planoId);
}
</script>
<template>
  <router-view />
</template>
