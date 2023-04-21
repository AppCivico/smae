<script setup>
import EstruturaAnalíticaProjeto from '@/components/projetos/EstruturaAnaliticaProjeto.vue';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';

const projetosStore = useProjetosStore();
const tarefasStore = useTarefasStore();
const {
  chamadasPendentes, emFoco, erro,
} = storeToRefs(projetosStore);
const {
  estruturaAnalíticaDoProjeto,
} = storeToRefs(tarefasStore);

defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

function iniciar() {
  if (!tarefasStore.lista.length) {
    tarefasStore.buscarTudo();
  }
}

iniciar();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ emFoco?.nome }}</h1>
    <hr class="ml2 f1">
  </div>

  <EstruturaAnalíticaProjeto
    v-if="estruturaAnalíticaDoProjeto?.length"
    :data="estruturaAnalíticaDoProjeto"
  />

  <span
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
