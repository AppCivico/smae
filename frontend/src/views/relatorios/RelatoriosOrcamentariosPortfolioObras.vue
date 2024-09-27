<script setup>
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import TabelaDeOrçamentários from '@/components/relatorios/TabelaDeOrcamentarios.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const relatóriosStore = useRelatoriosStore();
const fonte = 'ObrasOrcamento';

relatóriosStore.$reset();
relatóriosStore.getAll({ fonte });
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar.MDO') "
      :to="{ name: 'novoRelatórioOrçamentárioPortfolioObras' }"
      class="btn big ml2"
    >
      Novo relatório
    </router-link>
  </div>
  <!--div class="flex center mb2">
      <div class="f2 search">
          <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
      </div>
  </div-->

  <TabelaDeOrçamentários class="mb1" />

  <BotãoParaCarregarMais :fonte="fonte" />
</template>
