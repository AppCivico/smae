<script setup>
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import TabelaDeOrçamentários from '@/components/relatorios/TabelaDeOrcamentarios.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import {
  onUnmounted,
  computed,
  watch,
} from 'vue';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const relatóriosStore = useRelatoriosStore();
const fonte = 'ProjetoOrcamento';

let intervaloDeAtualizacao = null;
const temAlgumRelatorioEmProcessamento = computed(() => relatóriosStore
  .lista.some((relatorio) => !relatorio.arquivo));

async function carregarRelatorios() {
  await relatóriosStore.getAll({ fonte });
}

async function iniciar() {
  relatóriosStore.$reset();
  relatóriosStore.getAll({ fonte });
}

watch(temAlgumRelatorioEmProcessamento, (novoValor) => {
  if (novoValor) {
    if (!intervaloDeAtualizacao) {
      intervaloDeAtualizacao = setInterval(carregarRelatorios, 5000);
    }
  } else {
    clearInterval(intervaloDeAtualizacao);
    intervaloDeAtualizacao = null;
  }
});

iniciar();

onUnmounted(() => {
  if (intervaloDeAtualizacao) {
    clearInterval(intervaloDeAtualizacao);
  }
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar.Projetos') "
      :to="{ name: 'novoRelatórioOrçamentárioPortfolio' }"
      class="btn big ml2"
    >
      Novo relatório
    </router-link>
  </div>

  <TabelaDeOrçamentários class="mb1" />

  <BotãoParaCarregarMais :fonte="fonte" />
</template>
