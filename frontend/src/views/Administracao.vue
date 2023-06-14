<script setup>
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores';
import { Dashboard } from '@/components';
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
</script>

<template>
  <Dashboard>
    <div class="flex spacebetween center">
      <h1>Administração</h1>
    </div>
  </Dashboard>
</template>
