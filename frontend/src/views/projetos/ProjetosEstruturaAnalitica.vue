<script setup>
import EstruturaAnalíticaProjeto from '@/components/projetos/EstruturaAnaliticaProjeto.vue';
import MenuDeMudançaDeStatusDeProjeto from '@/components/projetos/MenuDeMudançaDeStatusDeProjeto.vue';
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
    <MenuDeMudançaDeStatusDeProjeto />

    <template v-if="emFoco?.id && !emFoco.arquivado">
      <router-link
        :to="{ name: 'projetosEditar', params: { projetoId: emFoco.id } }"
        class="btn big ml2"
      >
        Editar
      </router-link>
    </template>
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
