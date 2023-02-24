<script setup>
import { useProjetosStore } from '@/stores/projetos.store.ts';

const projetosStore = useProjetosStore();
const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

if (projetosStore.emFoco?.id !== props.projetoId) {
  projetosStore.$reset();

  projetosStore.buscarItem(props.projetoId);
}
</script>
<template>
  <router-view />
</template>
