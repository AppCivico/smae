<script setup>
import { usePortfolioStore } from '@/stores/portfolios.store.ts';

const portfolioStore = usePortfolioStore();

portfolioStore.buscarTudo();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      {{ typeof $route?.meta?.título === 'function'
        ? $route.meta.título()
        : $route?.meta?.título || 'Projetos' }}
    </h1>
    <hr class="ml2 f1">
    <router-link
      :to="{
        name: 'EnviosOrçamentosProjetosNovo',
        query: $route.query
      }"
      class="btn big ml1"
    >
      Enviar arquivo
    </router-link>
  </div>

  <div class="flex center mb2 spacebetween">
    <div class="f1">
      <label
        for="portfolio_id"
        class="label"
      >
        Portfólio&nbsp;<span
          class="tvermelho"
        >*</span>
      </label>
      <select
        id="portfolio_id"
        name="portfolio_id"
        class="inputtext light mb1"
        :value="$route.query.portfolio_id"
        :class="{
          loading: portfolioStore.chamadasPendentes.lista
        }"
        :disabled="portfolioStore.chamadasPendentes.lista"
        @change="($event) => $router.push({
          name: $route.name,
          query: { portfolio_id: $event.target.value || undefined }
        })"
      >
        <option :value="null">
          Todos
        </option>
        <option
          v-for="item in portfolioStore.lista"
          :key="item.id"
          :value="item.id"
          :selected="item.id == $route.query.portfolio_id"
        >
          {{ item.id }} - {{ item.titulo }}
        </option>
      </select>
    </div>

    <hr class="ml1 f1">
  </div>

  <router-view />

  <router-view
    v-slot="{ Component }"
    name="modal"
  >
    <component :is="Component" />
  </router-view>
</template>
