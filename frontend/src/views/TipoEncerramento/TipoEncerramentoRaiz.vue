<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { useAuthStore } from '@/stores';

const hasError = ref<boolean>(false);
const authStore = useAuthStore();
const { sistemaEscolhido } = storeToRefs(authStore);

if (!['Projetos', 'Obras'].includes(sistemaEscolhido.value)) {
  hasError.value = true;
}

</script>

<template>
  <router-view v-if="!hasError" />

  <h1 v-else>
    Página não habilitada para este módulo
  </h1>
</template>
