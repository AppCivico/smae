<script setup>
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { storeToRefs } from 'pinia';
import { onUnmounted } from 'vue';

const planosSetoriaisStore = usePlanosSetoriaisStore();

const props = defineProps({
  planoSetorialId: {
    type: Number,
    default: 0,
  },
});

const { emFoco } = storeToRefs(planosSetoriaisStore);

function iniciar() {
  if (emFoco?.id !== Number(props.planoSetorialId)) {
    planosSetoriaisStore.$reset();

    planosSetoriaisStore.buscarItem(props.planoSetorialId);
  }
}

iniciar();

onUnmounted(() => {
  planosSetoriaisStore.$reset();
});
</script>
<template>
  <router-view />
</template>
