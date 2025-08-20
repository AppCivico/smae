<script setup>
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import Gantt from '@/components/projetos/Gantt.vue';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';

const projetosStore = useProjetosStore();
const tarefasStore = useTarefasStore();
const {
  chamadasPendentes, emFoco, erro,
} = storeToRefs(projetosStore);
const {
  chamadasPendentes: tarefaChamapadaPendente, tarefasOrdenadas,
} = storeToRefs(tarefasStore);

function iniciar() {
  if (!tarefasStore.lista.length || !tarefasStore.lista[0]?.dependencias) {
    tarefasStore.buscarTudo({ incluir_dependencias: true });
  }
}

onMounted(() => {
  iniciar();
});
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ emFoco?.nome }}</h1>
    <hr class="ml2 f1">
  </div>

  <Gantt
    v-if="!tarefaChamapadaPendente?.emFoco && tarefasOrdenadas?.length"
    :data="tarefasOrdenadas"
  />

  <div
    v-if="chamadasPendentes?.emFoco"
    class="spinner"
  >
    Carregando
  </div>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
