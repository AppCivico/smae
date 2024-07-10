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

  case 'MDO':
    router.replace({
      name: 'EnviosOrçamentosObras',
    });
    break;

  default:
    throw new Error(`Sistema não tratado: ${sistemaEscolhido.value}`);
}
</script>
<template>
  <Dashboard>
    <router-view />
  </Dashboard>
</template>
