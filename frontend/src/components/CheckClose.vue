<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps({
  rotaDeEscape: {
    type: String,
    default: '',
  },
});

const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();

async function checkClose() {
  const routesMatchedLength = route.matched.length;
  const parentRoutePosition = routesMatchedLength >= 2
    ? routesMatchedLength - 2
    : routesMatchedLength - 1;

  let caminhoParaSaída = '';

  const rotaDeEscape = props?.rotaDeEscape || route.meta?.rotaDeEscape;

  if (rotaDeEscape) {
    const propriedadesDaRota = {
      ...(typeof rotaDeEscape === 'string' ? { name: rotaDeEscape } : rotaDeEscape),
      params: route.params,
      query: route.query,
    };

    caminhoParaSaída = router.resolve(propriedadesDaRota)?.path
      || route.matched[parentRoutePosition].path;
  } else {
    // Note: params are ignored if a path is provided, which is not the case for
    // query, as shown in the example above.
    // @link: https://router.vuejs.org/guide/essentials/navigation.html

    caminhoParaSaída = route.matched[parentRoutePosition].path;
  }

  alertStore.confirm('Deseja sair sem salvar as alterações?', caminhoParaSaída);
}
</script>
<template>
  <button
    class="btn round ml2"
    @click="checkClose"
  >
    <svg
      width="12"
      height="12"
    ><use xlink:href="#i_x" /></svg>
  </button>
</template>
