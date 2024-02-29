<script setup>
import { Dashboard } from '@/components';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';

const portfolioStore = usePortfolioStore();

portfolioStore.buscarTudo();
</script>
<template>
  <Dashboard>
    <MigalhasDePão class="mb1" />
    <router-view />
  </Dashboard>
</template>
