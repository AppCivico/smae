<script setup>
import { useRelatoriosStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import CheckClose from '../../components/CheckClose.vue';
import NovoMensal from '../../components/relatorios/NovoMensal.vue';
import NovoOrcamentario from '../../components/relatorios/NovoOrcamentario.vue';
import NovoSemestralOuAnual from '../../components/relatorios/NovoSemestralOuAnual.vue';

let { current } = storeToRefs(useRelatoriosStore());

const formulários = {
  novoRelatórioMensal: NovoMensal,
  novoRelatórioOrçamentário: NovoOrcamentario,
  novoRelatórioSemestralOuAnual: NovoSemestralOuAnual,
};

onMounted(() => {
  current = {};
});
const route = useRoute();
</script>

<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route.meta.título || route.name }}</h1>
    <hr class="ml2 f1">
    <CheckClose />
  </div>

  <component :is="formulários[route.name]" />
</template>
