<script setup>
import { onMounted, ref } from 'vue';
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
const dialogRef = ref(null);

onMounted(() => {
  // Abre o dialog como modal ao montar
  if (dialogRef.value) {
    dialogRef.value.showModal();
  }
});

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
  <dialog
    ref="dialogRef"
    class="editModal-dialog"
    @click.self="checkClose"
  >
    <slot />
    <div class="editModal">
      <div>
        <router-view />
      </div>
    </div>
  </dialog>
</template>
