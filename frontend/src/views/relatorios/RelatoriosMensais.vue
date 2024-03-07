<script setup>
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import TabelaDeMensais from '@/components/relatorios/TabelaDeMensais.vue';
import { useAuthStore } from '@/stores/auth.store';
import { usePaineisStore } from '@/stores/paineis.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const PainéisStore = usePaineisStore();
const relatóriosStore = useRelatoriosStore();

const fonte = 'MonitoramentoMensal';

PainéisStore.getAll();
relatóriosStore.$reset();
relatóriosStore.getAll({ fonte });
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar.') "
      :to="{ name: 'novoRelatórioMensal' }"
      class="btn big ml2"
    >
      Novo relatório
    </router-link>
  </div>
  <p class="texto--explicativo">SMAE gera um conjunto de 4 planilhas contendo os dados do ciclo mensal de monitoramento físico do mês informado.</p>
  <!--div class="flex center mb2">
    <div class="f2 search">
      <input
        v-model="filters.textualSearch"
        placeholder="Buscar"
        type="text"
        class="inputtext"
        @input="filterItems"
      >
    </div>
  </div-->

  <TabelaDeMensais class="mb1" />

  <BotãoParaCarregarMais :fonte="fonte" />
</template>
