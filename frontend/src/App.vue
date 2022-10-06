<script setup>
import { Alert, EditModal } from '@/components';
import { useRoute } from 'vue-router';
const route = useRoute();
</script>

<template>
    <router-view :key="route.fullPath" />
    <EditModal />
    <Alert />
</template>

<style lang="less">
@import url("@/_less/style.less");
</style>