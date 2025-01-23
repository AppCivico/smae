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
    // mesmo após consulta, a lista ainda é vazia
    if (!lista.value.length) {
      await router.push({
        name: 'variaveisListar',
      });
    }
  }

  const planoAtivo = lista.value.find((plano) => plano.ativo);

  if (planoAtivo) {
    router.push({
      name: `${route.meta.entidadeMãe}.planosSetoriaisMetas`,
      params: { planoSetorialId: planoAtivo.id },
    });
  } else {
    router.push({
      name: `${route.meta.entidadeMãe}.planosSetoriaisListar`,
    });
  }
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
