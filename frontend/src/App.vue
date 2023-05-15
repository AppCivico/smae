<script setup>
import { Alert, EditModal, SideBar } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { useRoute } from 'vue-router';

const route = useRoute();
const authStore = useAuthStore();
authStore.getDados();
</script>

<template>
  <router-view :key="route.fullPath" />
  <SideBar />
  <EditModal />
  <Alert />
</template>

<style lang="less">
@import url("@/_less/style.less");
</style>
