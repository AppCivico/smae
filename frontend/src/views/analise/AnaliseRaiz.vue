<script setup>
import { Dashboard } from '@/components';
import { useDashboardStore } from '@/stores/dashboard.store.ts';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();
const dashboardStore = useDashboardStore();

const {
  chamadasPendentes, erro, lista, dashboardEmFoco,
} = storeToRefs(dashboardStore);

dashboardStore.$reset();
dashboardStore.buscarTudo()
  .then(() => {
    if (lista.value.length && lista.value[0].id) {
      router.replace({
        query: {
          ...route.query,
          id: lista.value[0].id,
        },
      });
    }
  });
</script>
<template>
  <Dashboard>
    <div class="flex spacebetween center mb2">
      <header>
        <h1>
          {{ typeof route?.meta?.título === 'function'
            ? $route.meta.título()
            : $route?.meta?.título || 'Análise' }}
        </h1>
      </header>

      <hr class="ml2 f1">

      <router-link
        v-for="item in lista"
        :key="item.id"
        :to="{
          name: 'análises',
          query: {
            ...$route.query,
            id: item.id,
          },
        }"
        class="btn bgnone outline ml1"
      >
        {{ item.titulo }}
      </router-link>
    </div>

    <div
      v-if="erro"
      class="error p1"
    >
      <div class="error-msg">
        {{ erro }}
      </div>
    </div>

    <div
      v-if="chamadasPendentes?.lista"
      class="spinner"
    >
      Carregando
    </div>

    <iframe
      v-else-if="dashboardEmFoco"
      :src="dashboardEmFoco.url"
      frameborder="0"
      allowtransparency
    />
  </Dashboard>
</template>
