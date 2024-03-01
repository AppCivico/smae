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
          {{ typeof item.meta?.título === 'function'
            ? item.meta?.título()
            : item.meta?.título || item.name }}
        </router-link>
      </li>
    </ul>
  </nav>
</template>
<style lang="less" scoped>
.migalhas-de-pão {
  text-transform: uppercase;
  font-weight: 700;
  line-height: 1.5em;
}

.migalhas-de-pão__lista {
}

.migalhas-de-pão__item {
  display: inline;
  white-space: nowrap;

  &::after {
    color: @amarelo;
    content: '/';
    display: inline-block;
    margin-right: 0.5rem;
    margin-left: 0.5rem;
  }

  &:last-child {
    &::after {
      content: none;
    }
  }
}

.migalhas-de-pão__link {
  color: @primary;
  white-space: wrap;
}
</style>
