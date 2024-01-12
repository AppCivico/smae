<script setup>
import DocumentosDoProjeto from '@/components/projetos/DocumentosDoProjeto.vue';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';

defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

const projetosStore = useProjetosStore();

const {
  permissõesDoProjetoEmFoco,
} = storeToRefs(projetosStore);
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Documentos
    </TítuloDePágina>

    <hr class="ml2 f1">

    <router-link
      v-if="!permissõesDoProjetoEmFoco.apenas_leitura
        || permissõesDoProjetoEmFoco.sou_responsavel"
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
