<script setup>
import { useLiçõesAprendidasStore } from '@/stores/licoesAprendidas.store.ts';

const liçõesAprendidasStore = useLiçõesAprendidasStore();
const props = defineProps({
  licaoAprendidaId: {
    type: Number,
    default: 0,
  },
});

if (liçõesAprendidasStore.emFoco?.id !== props.licaoAprendidaId) {
  liçõesAprendidasStore.$reset();

  liçõesAprendidasStore.buscarItem(props.licaoAprendidaId);
}
</script>
<template>
  <router-view />
</template>
