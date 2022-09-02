<script setup>
import { Alert, EditModal } from '@/components';
</script>

<template>
    <Alert />
    <router-view />
    <EditModal />
</template>

<style lang="less">
@import url("@/_less/style.less");
</style>