<script setup>
import { useProjetosStore } from '@/stores/projetos.store.ts';

const projetosStore = useProjetosStore();
const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

async function iniciar() {
  projetosStore.$reset();

  await projetosStore.buscarItem(props.projetoId);
}

iniciar();
</script>
<template>
  <router-view />
</template>
