<script setup>
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'vue-router';

const router = useRouter();

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

if (user.value?.flags?.panorama) {
  router.replace({
    name: 'panorama',
  });
}
</script>
<template>
  <Dashboard>
    <div class="flex spacebetween center">
      <h1>Olá, {{ user.nome_exibicao }}</h1>
    </div>
  </Dashboard>
</template>
