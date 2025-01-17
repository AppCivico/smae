<script setup>
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { storeToRefs } from 'pinia';
import { onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const planosSetoriaisStore = usePlanosSetoriaisStore(route.meta.entidadeMãe);

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

    planosSetoriaisStore.buscarItem(props.planoSetorialId, { incluir_auxiliares: true });
  }
}

watch(() => props.planoSetorialId, () => {
  iniciar();
}, { immediate: true });

onUnmounted(() => {
  planosSetoriaisStore.$reset();
});
</script>
<template>
  <router-view />
</template>
