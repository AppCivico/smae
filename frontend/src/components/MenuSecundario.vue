<script setup>
import { useAuthStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const route = useRoute();
const router = useRouter();

let listaDeRotas = [];

switch (true) {
  case Array.isArray(route.meta?.rotasParaMenuSecundário):
    listaDeRotas = route.meta?.rotasParaMenuSecundário;
    break;

  case !!(route.meta?.rotasParaMenuSecundário?.name || route.meta?.rotasParaMenuSecundário?.path):
    listaDeRotas = [route.meta?.rotasParaMenuSecundário];
    break;

  default:
    break;
}

const rotasParaMenu = listaDeRotas.map((x) => {
  let rotaParaResolver = x;

  if (typeof x === 'string') {
    if (x.indexOf('/') > -1) {
      rotaParaResolver = { path: x };
    } else {
      rotaParaResolver = { name: x };
    }
  }

  return router.resolve({ ...rotaParaResolver, params: route.params });
})
// eslint-disable-next-line max-len
  /* .filter((x) => (!x.meta?.restringirÀsPermissões || temPermissãoPara(x.meta.restringirÀsPermissões)))
    || [] */;
</script>
<template>
  <div
    v-if="rotasParaMenu.length"
    id="submenu"
  >
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
          v-for="item, k in rotasParaMenu"
          :key="k"
          :to="item"
        >
          {{ item.meta?.títuloParaMenu || item.meta?.título || item.name }}
        </router-link>
      </div>
    </div>
  </div>
</template>
