<script setup>
import { Alert, EditModal, SideBar } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { useRoute } from 'vue-router';

const route = useRoute();
const authStore = useAuthStore();
if (authStore.estouAutenticada) {
  authStore.getDados();
}
</script>
<template>
  <!-- vamos avançar até essa chave ser desnecessária para o sistema todo -->
  <router-view v-if="$route.meta.rotaPrescindeDeChave ?? habilitarBeta" />
  <router-view
    v-else
    :key="route.fullPath"
  />
  <SideBar />
  <EditModal />
  <Alert />
</template>

<style lang="less">
@import url("@/_less/style.less");
</style>
