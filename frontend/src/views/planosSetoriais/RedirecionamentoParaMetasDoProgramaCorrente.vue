<script setup lang="ts">
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

const planosSetoriaisStore = usePlanosSetoriaisStore(route.meta.entidadeMãe as string);
const {
  lista, planoAtivo, chamadasPendentes, erros,
} = storeToRefs(planosSetoriaisStore);

async function iniciar() {
  if (!lista.value.length) {
    await planosSetoriaisStore.buscarTudo();
    // mesmo após consulta, a lista ainda é vazia?
    // então, vamos para a lista de variáveis
    if (!lista.value.length) {
      return router.push({
        name: 'variaveisListar',
      });
    }
  }

  return planoAtivo.value
    ? router.push({
      name: `${route.meta.entidadeMãe}.listaDeMetas`,
      params: { planoSetorialId: planoAtivo.value.id },
    })
    : router.push({
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
