<script setup>
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';

const projetosStore = useProjetosStore();
const tarefasStore = useTarefasStore();
const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

// Tarefas dependem do projeto, portanto precisam ser redefinidas na troca deste
tarefasStore.$reset();

if (projetosStore.emFoco?.id !== props.projetoId) {
  projetosStore.$reset();

  projetosStore.buscarItem(props.projetoId);
}
</script>
<template>
  <router-view />
</template>
