<script setup>
import { useAuthStore } from '@/stores';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const route = useRoute();
const router = useRouter();

const limparRotas = (listaDeRotas) => (Array.isArray(listaDeRotas)
  ? listaDeRotas
  : [listaDeRotas])
  .map((x) => {
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
  .filter((y) => (!y.meta?.restringirÀsPermissões || temPermissãoPara.value(y.meta.restringirÀsPermissões)))
  || [];

const rotasParaMenu = route.meta?.rotasParaMenuSecundário
  ? limparRotas(route.meta?.rotasParaMenuSecundário)
  : [];

const rotasParaMigalhasDePão = route.meta?.rotasParaMigalhasDePão
  ? limparRotas(route.meta?.rotasParaMigalhasDePão)
  : [];

</script>
<template>
  <div
    v-if="rotasParaMenu.length || rotasParaMigalhasDePão.length"
    id="submenu"
  >
    <div
      v-if="rotasParaMigalhasDePão.length"
      class="breadcrumbmenu"
    >
      <router-link
        v-for="item, k in rotasParaMigalhasDePão"
        :key="k"
        :to="item.href"
      >
        <span>
          {{ typeof item.meta?.título === 'function'
            ? item.meta?.título()
            : item.meta?.título || item.name }}
        </span>
      </router-link>
    </div>

    <div
      v-if="rotasParaMenu.length"
      class="subpadding"
    >
      <div class="links-container mb2">
        <router-link
          v-for="item, k in rotasParaMenu"
          :key="k"
          :to="item.href"
        >
          {{ item.meta?.títuloParaMenu
            || (typeof item.meta?.título === 'function'
              ? item.meta.título()
              : item.meta?.título
              || item.name
            )
          }}
        </router-link>
      </div>
    </div>
  </div>
</template>
