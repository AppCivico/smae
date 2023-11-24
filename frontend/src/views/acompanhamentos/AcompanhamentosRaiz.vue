<script setup>
import { useRiscosStore } from '@/stores/riscos.store.ts';
import { useTiposDeAcompanhamentoStore } from '@/stores/tiposDeAcompanhamento.store.ts';

const riscosStore = useRiscosStore();
const tiposDeAcompanhamentoStore = useTiposDeAcompanhamentoStore();

if (!riscosStore?.lista?.length) {
  riscosStore?.buscarTudo();
}

if (!tiposDeAcompanhamentoStore?.lista?.length) {
  tiposDeAcompanhamentoStore?.buscarTudo();
}
</script>
<template>
  <router-view />
</template>
