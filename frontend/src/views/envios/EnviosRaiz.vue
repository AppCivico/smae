<script setup>
import { Dashboard } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

const router = useRouter();

const authStore = useAuthStore();
const {
  sistemaCorrente,
} = storeToRefs(authStore);

switch (sistemaCorrente.value) {
  case 'PDM':
    router.replace({
      name: 'EnviosOrcamentosMetasPdm',
    });
    break;

  case 'ProgramaDeMetas':
  case 'PlanoSetorial':
    router.replace({
      name: 'EnviosOrcamentosMetas',
    });
    break;

  case 'Projetos':
    router.replace({
      name: 'EnviosOrcamentosProjetos',
    });
    break;

  case 'MDO':
    router.replace({
      name: 'EnviosOrcamentosObras',
    });
    break;

  default:
    throw new Error(`Sistema não tratado: ${sistemaCorrente.value}`);
}
</script>
<template>
  <Dashboard>
    <router-view />
  </Dashboard>
</template>
