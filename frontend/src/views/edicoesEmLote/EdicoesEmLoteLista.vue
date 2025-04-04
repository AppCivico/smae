<script lang="ts" setup>
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const route = useRoute();

const edicoesEmLoteStore = useEdicoesEmLoteStore(route.meta.tipoDeAcoesEmLote as string);
const { lista } = storeToRefs(edicoesEmLoteStore);

edicoesEmLoteStore.buscarTudo({ tipo: route.meta.tipoDeAcoesEmLote as string });
</script>

<template>
  <CabecalhoDePagina>
    <template #acoes>
      <router-link
        v-if="$route.meta.rotaDeAdição"
        :to="$route.meta.rotaDeAdição"
        class="btn big ml1"
      >
        Nova edição em lote
      </router-link>
    </template>
  </CabecalhoDePagina>

  <p class="debug">
    Aqui, listamos as edições em lote concluídas
  </p>

  <pre>
    {{ lista }}
  </pre>
</template>
