<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import MigalhasDePao from '@/components/MigalhasDePao.vue';
import TituloDaPagina from '@/components/TituloDaPagina.vue';
import ProjetosListaFiltro from './partials/ProjetosListaFiltro.vue';

const route = useRoute();

watch(() => route.query, (query) => {
  alert('Buscar');
});
</script>

<template>
  <MigalhasDePao />

  <section class="projetos-lista">
    <div class="projetos-lista__header flex spacebetween center mb2">
      <TituloDaPagina />
    </div>

    <ProjetosListaFiltro />
  </section>
</template>
