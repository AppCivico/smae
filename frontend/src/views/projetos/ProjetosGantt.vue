<script setup>
import Gantt from '@/components/projetos/Gantt.vue';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';

const projetosStore = useProjetosStore();
const tarefasStore = useTarefasStore();
const {
  chamadasPendentes, emFoco, erro,
} = storeToRefs(projetosStore);
const {
  tarefasOrdenadas,
} = storeToRefs(tarefasStore);

defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

function iniciar() {
  if (!tarefasStore.lista.length || !tarefasStore.lista[0]?.dependencias) {
    tarefasStore.buscarTudo({ incluir_dependencias: true });
  }
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <div>
      <div class="t12 uc w700 tamarelo">
        Projeto
        <template v-if="emFoco?.eh_prioritario">
          prioritário
        </template>
      </div>

      <h1>{{ emFoco?.nome }}</h1>
    </div>
    <hr class="ml2 f1">
  </div>

  <Gantt
    v-if="tarefasOrdenadas.length"
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
