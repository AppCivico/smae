<script setup>
import { storeToRefs } from 'pinia';
import { Nav } from '@/components';
import { useEditModalStore, useAuthStore } from '@/stores';

const editModalStore = useEditModalStore();
const { editModal } = storeToRefs(editModalStore);

const props = defineProps(['submenu','parentPage']);

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
</script>

<template>
    <Nav :activate="props?.submenu?.__name"></Nav>
    <component :is="submenu" :parentPage="parentPage"></component>
    <section v-if="user" id="dashboard" :style="{overflow: editModal?'auto':hidden}">
        <slot />
    </section>
</template>