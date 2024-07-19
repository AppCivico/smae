<script setup>
import Dashboard from '@/components/DashboardLayout.vue';
import { usePdMStore } from '@/stores/pdm.store';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted } from 'vue';

const PdmStore = usePdMStore();
const { activePdm } = storeToRefs(PdmStore);

const baseUrl = `${import.meta.env.VITE_API_URL}`;

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

    <router-view
      v-if="activePdm?.id"
      v-slot="{ Component }"
    >
      <component :is="Component">
        <template #icone>
          <img
            v-if="activePdm.logo"
            class="título-da-página__ícone"
            :src="`${baseUrl}/download/${activePdm.logo}?inline=true`"
            width="100"
          >
        </template>
      </component>
    </router-view>
  </Dashboard>
</template>
