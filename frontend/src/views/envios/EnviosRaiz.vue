<script setup>
import { Dashboard } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

const router = useRouter();

const authStore = useAuthStore();
const {
  sistemaEscolhido,
} = storeToRefs(authStore);

switch (sistemaEscolhido.value) {
  case 'PDM':
    router.replace({
      name: 'EnviosOrçamentosMetas',
    });
    break;

  case 'Projetos':
    router.replace({
      name: 'EnviosOrçamentosProjetos',
    });
    break;

  default:
    break;
}
</script>
<template>
  <Dashboard>
    <router-view />
  </Dashboard>
</template>
