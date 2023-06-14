<script setup>
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
</script>

<template>
  <Dashboard>
    <div class="flex spacebetween center">
      <h1>Olá, {{ user.nome_exibicao }}</h1>
    </div>
  </Dashboard>
</template>
