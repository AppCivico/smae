<script setup>
import { Alert, EditModal, SideBar } from '@/components';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();
if (authStore.estouAutenticada) {
  authStore.getDados();
}
</script>
<template>
  <!-- vamos avançar até essa chave ser desnecessária para o sistema todo -->
  <router-view v-if="$route.meta.rotaPrescindeDeChave ?? gblHabilitarBeta" />
  <router-view
    v-else
    :key="$route.path"
  />
  <SideBar />
  <EditModal />
  <Alert />
</template>

<style lang="less">
@import url("@/_less/style.less");
</style>
