<script setup>
import prepararRotaDeEscape from '@/helpers/prepararRotaDeEscape';
import { useAlertStore } from '@/stores/alert.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { useRoute, useRouter } from 'vue-router';

defineOptions({
  inheritAttrs: false,
});

const editModalStore = useEditModalStore();

const props = defineProps({
  apenasEmitir: {
    type: Boolean,
    default: false,
  },
  apenasModal: {
    type: Boolean,
    default: false,
  },
  formularioSujo: {
    type: Boolean,
    default: true,
  },
  rotaDeEscape: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close']);

const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();

async function checkClose() {
  const routesMatchedLength = route.matched.length;
  const parentRoutePosition = routesMatchedLength >= 2
    ? routesMatchedLength - 2
    : routesMatchedLength - 1;

  let caminhoParaSaída = '';

  const rotaDeEscape = props?.rotaDeEscape
    ? prepararRotaDeEscape(route, { name: props?.rotaDeEscape })
    : prepararRotaDeEscape(route);

  if (rotaDeEscape) {
    caminhoParaSaída = router.resolve(rotaDeEscape)?.fullPath
      || route.matched[parentRoutePosition].path;
  } else {
    // Note: params are ignored if a path is provided, which is not the case for
    // query, as shown in the example above.
    // @link: https://router.vuejs.org/guide/essentials/navigation.html

    caminhoParaSaída = route.matched[parentRoutePosition].path;
  }

  const destino = () => {
    emit('close');

    if (!props.apenasEmitir) {
      editModalStore.$reset();
    }

    alertStore.$reset();

    if (!props.apenasModal && !props.apenasEmitir) {
      router.push(caminhoParaSaída);
    }
  };

  if (props.formularioSujo) {
    alertStore.confirm('Deseja sair sem salvar as alterações?', destino);
  } else {
    destino();
  }
}
</script>
<template>
  <pre
    v-ScrollLockDebug="'formularioSujo'"
    class="f1"
  >{{ formularioSujo }}</pre>

  <button
    class="btn round ml2 botao-de-fechamento"
    v-bind="$attrs"
    @click="checkClose"
  >
    <svg
      width="12"
      height="12"
    ><use xlink:href="#i_x" /></svg>
  </button>
</template>
<style scoped>
.botao-de-fechamento {
  flex-shrink: 0;
}
</style>
