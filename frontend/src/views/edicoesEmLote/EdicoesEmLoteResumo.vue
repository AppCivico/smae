<script setup lang="ts">
import { useEdicoesEmLoteStore } from '@/stores/edicoesEmLote.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const route = useRoute();

const edicoesEmLoteStore = useEdicoesEmLoteStore(route.meta.tipoDeAcoesEmLote as string);
const { emFoco } = storeToRefs(edicoesEmLoteStore);

edicoesEmLoteStore.buscarItem(route.params.edicaoEmLoteId as unknown as number);
</script>
<template>
  <CabecalhoDePagina />

  <p class="debug">
    Aqui carregamos os detalhes de uma edição criada.
  </p>

  <pre>
    emFoco: {{ emFoco }}
  </pre>
</template>
