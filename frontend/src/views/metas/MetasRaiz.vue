<script setup>
import Dashboard from '@/components/DashboardLayout.vue';
import { usePdMStore } from '@/stores/pdm.store';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted } from 'vue';

const PdmStore = usePdMStore();
const { activePdm } = storeToRefs(PdmStore);

onMounted(async () => {
  if (!activePdm.value.id) {
    await PdmStore.getActive();
  }
});

onUnmounted(() => {
  PdmStore.$reset();
});
</script>
<template>
  <Dashboard>
    <ErrorComponent
      v-if="activePdm.error"
      class="fb100 mb1"
    >
      {{ activePdm.error }}
    </ErrorComponent>

    <router-view v-if="activePdm?.id" />
  </Dashboard>
</template>
