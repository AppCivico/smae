<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import MenuSecundario from '@/components/MenuSecundario.vue';
import { Nav } from '@/components';
import { useAuthStore } from '@/stores/auth.store';
import { useEditModalStore } from '@/stores/editModal.store';
import { useWikiStore } from '@/stores/wiki.store';

const wikiStore = useWikiStore();
const editModalStore = useEditModalStore();
const { editModal } = storeToRefs(editModalStore);
const props = defineProps(['submenu', 'parentPage']);
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

onMounted(() => {
  wikiStore.buscar();
});
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
