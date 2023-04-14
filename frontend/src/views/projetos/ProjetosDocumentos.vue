<script setup>
import { useProjetosStore } from '@/stores/projetos.store.ts';
import DocumentosDoProjeto from '@/views/projetos/DocumentosDoProjeto.vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});
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

    <router-link
      :to="{
        name: 'projetosNovoDocumento',
        params: {
          projetoId
        }
      }"
      class="btn ml2"
    >
      Novo arquivo
    </router-link>
  </div>

  <DocumentosDoProjeto />
</template>
