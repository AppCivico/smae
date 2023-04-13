<script setup>
import DocumentosDoProjeto from '@/components/projetos/DocumentosDoProjeto.vue';
import MenuDeMudançaDeStatusDeProjeto from '@/components/projetos/MenuDeMudançaDeStatusDeProjeto.vue';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const projetosStore = useProjetosStore();
const {
  emFoco,
} = storeToRefs(projetosStore);
const route = useRoute();
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

      <h1>
        {{ typeof route?.meta?.título === 'function'
          ? route.meta.título()
          : route?.meta?.título || 'Documentos' }}
      </h1>
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

  <DocumentosDoProjeto />
</template>
