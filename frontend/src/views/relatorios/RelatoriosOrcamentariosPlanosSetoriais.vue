<script setup>
import { storeToRefs } from 'pinia';
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import TabelaDeOrçamentários from '@/components/relatorios/TabelaDeOrcamentarios.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const relatóriosStore = useRelatoriosStore();
const fonte = 'PSOrcamento';

relatóriosStore.$reset();
relatóriosStore.getAll({ fonte });
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara([
        'Reports.executar.PlanoSetorial',
        'Reports.executar.ProgramaDeMetas'
      ]) "
      :to="{ name: 'novoRelatórioOrçamentárioPlanosSetoriais' }"
      class="btn big ml2"
    >
      Novo relatório
    </router-link>
  </div>
  <p class="texto--explicativo">
    SMAE gera 2 planilhas contendo os registros de execução orçamentária e do orçamento planejado. A versão analítica retorna todos os registros e a versão consolidada retorna somente o valor vigente no momento.
  </p>

  <!--div class="flex center mb2">
      <div class="f2 search">
          <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
      </div>
  </div-->

  <TabelaDeOrçamentários class="mb1" />

  <BotãoParaCarregarMais :fonte="fonte" />
</template>
