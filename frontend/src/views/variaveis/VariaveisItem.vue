<script setup>
import { storeToRefs } from 'pinia';
import { onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store.ts';

const variaveisGlobaisStore = useVariaveisGlobaisStore();

const props = defineProps({
  variavelId: {
    type: Number,
    default: 0,
  },
});

const route = useRoute();

const { emFoco } = storeToRefs(variaveisGlobaisStore);

function iniciar() {
  const variavelId = Number(props.variavelId || route.query.copiar_de);

  if (emFoco.value?.id !== variavelId && variavelId) {
    emFoco.value = null;
    variaveisGlobaisStore.buscarItem(variavelId, { incluir_auxiliares: true });
  }
}

iniciar();

onUnmounted(() => {
  variaveisGlobaisStore.$reset();
});
</script>
<template>
  <router-view />
</template>
