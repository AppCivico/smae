<script setup>
import { Nav } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { storeToRefs } from 'pinia';

const editModalStore = useEditModalStore();
const { editModal } = storeToRefs(editModalStore);
const props = defineProps(['submenu', 'parentPage']);
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
</script>

<template>
  <Nav :activate="props?.submenu?.__name" />
  <component
    :is="submenu"
    :parent-page="parentPage"
  />
  <section
    v-if="user"
    id="dashboard"
    :class="{ 'edit-modal': editModal }"
  >
    <slot />
  </section>
</template>
