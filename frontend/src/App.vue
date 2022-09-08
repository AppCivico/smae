<script setup>
import { Alert, EditModal } from '@/components';
</script>

<template>
    <router-view />
    <EditModal />
    <Alert />
</template>

<style lang="less">
@import url("@/_less/style.less");
</style>