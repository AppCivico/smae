<script setup>
import { useAlertStore } from '@/stores';
import { useRoute } from 'vue-router';

const route = useRoute();
const alertStore = useAlertStore();

async function checkClose() {
  const routesMatchedLength = route.matched.length;
  const parentRoutePosition = routesMatchedLength >= 2
    ? routesMatchedLength - 2
    : routesMatchedLength - 1;

  alertStore.confirm('Deseja sair sem salvar as alterações?', route.meta?.rotaDeEscape || route.matched?.[parentRoutePosition].path);
}
</script>
<template >
  <button @click="checkClose" class="btn round ml2"><svg width="12" height="12"><use xlink:href="#i_x"></use></svg></button>
</template>
