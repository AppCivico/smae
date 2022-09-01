<script setup>
import { storeToRefs } from 'pinia';
import { Nav } from '@/components';
import { useAuthStore } from '@/stores';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
</script>

<template>
    <Nav />
    <section v-if="user" id="dashboard">
        <slot />
    </section>
</template>