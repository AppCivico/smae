<script setup>
import { useAlertStore, useRelatoriosStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
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

const alertStore = useAlertStore();

const route = useRoute();

async function checkClose() {
  alertStore.confirm('Deseja sair sem salvar as alterações?', route.meta?.rotaDeEscape || route.matched?.[0].path);
}
</script>

<template>
    <div class="flex spacebetween center mb2">
        <h1>{{ route.meta.título || route.name }}</h1>
        <hr class="ml2 f1"/>
        <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
    </div>

    <component :is="formulários[route.name]" />
</template>
