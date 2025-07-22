<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

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
  .filter((y) => (!y.meta?.limitarÀsPermissões || temPermissãoPara.value(y.meta.limitarÀsPermissões)))
  || [];

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
  <nav
    v-if="rotasParaMigalhasDePão.length"
    class="migalhas-de-pão"
  >
    <ul class="migalhas-de-pão__lista">
      <li
        v-for="item, k in rotasParaMigalhasDePão"
        :key="k"
        class="migalhas-de-pão__item"
      >
        <router-link
          class="migalhas-de-pão__link"
          :to="item.href"
        >
          {{
            item.meta?.tituloParaMigalhaDePao && (
              typeof item.meta.tituloParaMigalhaDePao === 'function' ?
                item.meta.tituloParaMigalhaDePao()
                : item.meta.tituloParaMigalhaDePao
            )
              || item.meta?.títuloParaMenu
              || item.meta.título && (
                typeof item.meta.título === 'function' ?
                  item.meta.título()
                  : item.meta.título
              )
              || item.name
          }}
        </router-link>
      </li>
      <li
        class="migalhas-de-pão__item"
      >
        {{
          $route.meta?.tituloParaMigalhaDePao && (
            typeof $route.meta.tituloParaMigalhaDePao === 'function' ?
              $route.meta.tituloParaMigalhaDePao()
              : $route.meta.tituloParaMigalhaDePao
          )
            || $route.meta?.títuloParaMenu
            || $route.meta?.título && (
              typeof $route.meta?.título === 'function' ?
                $route.meta?.título()
                : $route.meta?.título
            )
            || $route.name
        }}
      </li>
    </ul>
  </nav>
</template>
