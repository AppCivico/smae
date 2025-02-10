<script setup>
import { storeToRefs } from 'pinia';
import MenuSecundario from '@/components/MenuSecundario.vue';
import { Nav } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { useEditModalStore } from '@/stores/editModal.store';

const editModalStore = useEditModalStore();
const { editModal } = storeToRefs(editModalStore);
const props = defineProps(['submenu', 'parentPage']);
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <Nav :activate="props?.submenu?.__name" />
  <component
    :is="submenu"
    v-if="submenu"
    :parent-page="parentPage"
  />
  <MenuSecundario
    v-else
    class="carregado-via-route.meta"
  />
  <main
    v-if="user"
    id="dashboard"
    :class="{ 'edit-modal': editModal }"
    v-bind="$attrs"
  >
    <slot />
  </main>
</template>
