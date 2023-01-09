<script setup>
import { useAuthStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const route = useRoute();

const subMenu = route.matched?.[0]?.children
  .filter((x) => {
    const { presenteNoMenu, restringirÀsPermissões } = x.meta || {};

    return presenteNoMenu
      && (restringirÀsPermissões === undefined || temPermissãoPara(restringirÀsPermissões));
  }) || [];
const raizDoSubmenu = route.matched?.[0]?.path;
</script>
<template>
  <div id="submenu">
    <div
      v-if="route.meta.usarMigalhasDePão"
      class="breadcrumbmenu"
    >
      <!--
        TODO -->
    </div>

    <div class="subpadding">
      <div class="links-container mb2">
        <router-link
          v-for="item, k in subMenu"
          :key="k"
          :to="`${raizDoSubmenu}/${item.path}`"
        >
          {{ item.meta?.títuloParaMenu || item.meta?.título || item.name }}
        </router-link>
      </div>
    </div>
  </div>
</template>
