<script lang="ts" setup>
/**
 * @file TransferenciasVoluntariasItem.vue
 * @description Componente para buscar os dados da Transferência Voluntária
 * corrente e disponibiliza-los para todas as rotas filhas
 * @author Sobral
 * @date 2025-05-28
 */

import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { storeToRefs } from 'pinia';
import { watch } from 'vue';

const TransferenciasVoluntariasStore = useTransferenciasVoluntariasStore();

const { emFoco: transferenciaEmFoco } = storeToRefs(TransferenciasVoluntariasStore);

const props = defineProps({
  transferenciaId: {
    type: Number,
    default: 0,
  },
});

watch(
  () => props.transferenciaId,
  (novaTransferenciaId) => {
    if (novaTransferenciaId && novaTransferenciaId !== transferenciaEmFoco.value?.id) {
      TransferenciasVoluntariasStore.$reset();

      TransferenciasVoluntariasStore.buscarItem(novaTransferenciaId);
    }
  },
  { immediate: true },
);
</script>
<template>
  <router-view />
</template>
