<script setup>
import { Dashboard } from '@/components';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';

const portfolioStore = usePortfolioStore();

portfolioStore.buscarTudo();
</script>
<template>
  <Dashboard>
    <router-view />
  </Dashboard>
</template>
