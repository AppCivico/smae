<script setup>
import { useAuthStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const route = useRoute();

const subMenu = route.matched?.[0]?.children
  .filter((x) => x.meta?.restringirÀsPermissões === undefined || (Array.isArray(x.meta?.restringirÀsPermissões) && x.meta?.restringirÀsPermissões.some(y => user.value.privilegios?.indexOf(y) !== -1))) || [];
const raizDoSubmenu = route.matched?.[0]?.path;
</script>
<template>
    <div id="submenu">
        <div v-if="route.meta.usarMigalhasDePão" class="breadcrumbmenu"><!--
        TODO --></div>

        <div class="subpadding">
            <div class="links-container mb2">
                <router-link v-for="item, k in subMenu" :to="`${raizDoSubmenu}/${item.path}`" :key="k">
                  {{ item.meta?.títuloParaMenu || item.meta?.título || item.name }}
                </router-link>
            </div>
        </div>
    </div>
</template>
