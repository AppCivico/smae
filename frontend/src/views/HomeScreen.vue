<script setup>
import { storeToRefs } from 'pinia';
import { Dashboard } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'vue-router';

const router = useRouter();

const authStore = useAuthStore();
const { user, temPermissãoPara } = storeToRefs(authStore);

if (user.value?.flags?.panorama) {
  if (temPermissãoPara(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'])) {
    router.replace({
      name: 'panorama',
    });
  }
}
</script>
<template>
  <Dashboard>
    <div class="flex spacebetween center">
      <h1>Olá, {{ user.nome_exibicao }}</h1>
    </div>
  </Dashboard>
</template>
