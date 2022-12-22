<script setup>
import { Nav } from '@/components';
import { useAuthStore, useEditModalStore } from '@/stores';
import { storeToRefs } from 'pinia';

const editModalStore = useEditModalStore();
const { editModal } = storeToRefs(editModalStore);

const props = defineProps(['submenu','parentPage']);

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
</script>

<template>
    <Nav :activate="props?.submenu?.__name"></Nav>
    <component :is="submenu" :parentPage="parentPage"></component>
    <section v-if="user" id="dashboard" :style="{overflow: editModal ? 'auto' : 'hidden' }">
        <slot />
    </section>
</template>
