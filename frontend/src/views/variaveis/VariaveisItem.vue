<script setup>
import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store.ts';
import { storeToRefs } from 'pinia';
import { onUnmounted } from 'vue';

const variaveisGlobaisStore = useVariaveisGlobaisStore();

const props = defineProps({
  variavelId: {
    type: Number,
    default: 0,
  },
});

const { emFoco } = storeToRefs(variaveisGlobaisStore);

function iniciar() {
  if (emFoco?.id !== Number(props.variavelId)) {
    emFoco.value = null;
    variaveisGlobaisStore.buscarItem(props.variavelId);
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
