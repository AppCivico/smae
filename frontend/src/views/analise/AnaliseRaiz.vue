<script setup>
import { Dashboard } from '@/components';
import { useDashboardStore } from '@/stores/dashboard.store.ts';
import { iframeResize } from 'iframe-resizer';
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
    if (route.query.id) return;
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
      class="iframe-placeholder loading"
    >
      Carregando
    </div>

    <iframe
      v-else-if="dashboardEmFoco"
      :src="dashboardEmFoco.url"
      frameborder="0"
      allowtransparency
      @load="iframeResize($event.target)"
    />
  </Dashboard>
</template>
<style lang="css">
iframe {
  min-width: 100%;
  flex-grow: 1;
}

.iframe-placeholder {
  margin-right: auto;
  margin-left: auto;
  width: max-content;
  padding-right: 2.5em;
}
</style>
