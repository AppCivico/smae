<script setup lang="ts">
import { ModuloSistema } from '@/consts/modulosDoSistema';
import { useAuthStore } from '@/stores/auth.store';

const { sistemaEscolhido } = useAuthStore();

if (![ModuloSistema.Projetos].includes(sistemaEscolhido)) {
  throw new Error('Página não habilitada para este módulo');
}
</script>

<template>
  <router-view />
</template>
