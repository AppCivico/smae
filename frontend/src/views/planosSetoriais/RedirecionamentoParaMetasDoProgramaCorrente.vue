<script setup lang="ts">
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

const planosSetoriaisStore = usePlanosSetoriaisStore(route.meta.entidadeMãe as string);
const {
  lista, chamadasPendentes, erros,
} = storeToRefs(planosSetoriaisStore);

async function iniciar() {
  if (!lista.value.length) {
    await planosSetoriaisStore.buscarTudo();
  }

  lista.value.forEach(async (plano) => {
    if (plano.ativo) {
      await router.push({
        name: `${route.meta.entidadeMãe}.planosSetoriaisMetas`,
        params: { id: plano.id },
      });
    }
  });

  router.push({
    name: `${route.meta.entidadeMãe}.planosSetoriaisListar`,
  });
}
iniciar();
</script>
<template>
  <LoadingComponent v-if="chamadasPendentes.lista">
    Carregando {{ $route.meta.tituloPlural || 'listagem' }}...
  </LoadingComponent>
  <ErrorComponent v-if="erros.lista">
    {{ erros.lista }}
  </ErrorComponent>
</template>
