<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store';

const { sistemaEscolhido } = useAuthStore();

if (!['Projetos', 'MDO'].includes(sistemaEscolhido)) {
  throw new Error('Página não habilitada para este módulo');
}
</script>

<template>
  <router-view />
</template>
