<script setup>
import { useAuthStore } from '@/stores/auth.store';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
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

const rotasParaMenu = computed(() => {
  const listaDeRotas = typeof route.meta?.rotasParaMenuSecundário === 'function'
    ? route.meta.rotasParaMenuSecundário()
    : route.meta?.rotasParaMenuSecundário;

  return listaDeRotas
    ? limparRotas(listaDeRotas)
    : [];
});

const rotasParaMigalhasDePão = computed(() => {
  const listaDeRotas = typeof route.meta?.rotasParaMigalhasDePão === 'function'
    ? route.meta.rotasParaMigalhasDePão()
    : route.meta?.rotasParaMigalhasDePão;

  return listaDeRotas
    ? limparRotas(listaDeRotas)
    : [];
});

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
