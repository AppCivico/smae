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

<style lang="less">

.botao-wiki {
  background-color: #20A0B7;
  border: none;
  padding: 6px 15px;
  border-radius: 999px;
  font-size: 32px;
  color: #fff;
  position: fixed;
  display: none;
  z-index: 1005;
}

.botao-wiki--direito-cima {
  display: initial;
  right: 0;
  padding: 15px 3px 24px;
  top: 0;
  border-radius: 0 0 0 999px;
}

.botao-wiki--direito-cima, .botao-wiki--direito {
  transition: padding 0.2s ease-in;

  &:hover {
    padding: 25px 25px 40px 40px;
  }
}
</style>
