<script setup>
import DocumentosDoProjeto from '@/components/projetos/DocumentosDoProjeto.vue';

defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Documentos
    </TítuloDePágina>

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
