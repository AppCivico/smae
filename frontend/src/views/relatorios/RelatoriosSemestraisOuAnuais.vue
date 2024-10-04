<script setup>
import { useRoute } from 'vue-router';
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import TabelaDeSemestraisOuAnuais from '@/components/relatorios/TabelaDeSemestraisOuAnuais.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const relatóriosStore = useRelatoriosStore();
const fonte = useRoute().meta.fonteParaRelatório;

relatóriosStore.$reset();
relatóriosStore.getAll({ fonte });
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar.') "
      :to="{ name: 'novoRelatórioSemestralOuAnual' }"
      class="btn big ml2"
    >
      Novo relatório
    </router-link>
  </div>
  <p class="texto--explicativo">
    SMAE gera um conjunto de 2 planilhas contendo os indicadores da meta e de
    seus desdobramentos e valores das variáveis regionalizadas. A versão
    analítica retorna todos os valores das séries e a consolidada somente os
    valores consolidados do final de cada semestre/ano
  </p>
  <!--div class="flex center mb2">
      <div class="f2 search">
          <input v-model="filters.textualSearch" @input="filterItems" placeholder="Buscar" type="text" class="inputtext" />
      </div>
  </div-->

  <TabelaDeSemestraisOuAnuais class="mb1" />

  <BotãoParaCarregarMais :fonte="fonte" />
</template>
