<template>
  <SmallModal
    :active="modalVisivel"
    @close="fecharModal"
  >
    <section class="ciclo-atualizacao-editar">
      <header class="flex spacebetween center mb2 g2">
        <h1 class="ciclo-atualizacao-editar__titulo">
          {{ conteudoEscolhido.titulo }}
        </h1>

        <hr class="f1">

        <button
          class="btn round-full"
          @click="fecharModal"
        >
          <svg
            width="24"
            height="24"
          ><use xlink:href="#i_x" /></svg>
        </button>
      </header>

      <component
        :is="conteudoEscolhido.componente"
        v-if="cicloAtualizacaoStore.emFoco"
        @enviado="fecharModal"
      />
    </section>
  </SmallModal>
</template>

<script lang="ts" setup>
import type { Component } from 'vue';
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useCicloAtualizacaoStore } from '@/stores/cicloAtualizacao.store';
import { useVariaveisCategoricasStore } from '@/stores/variaveisCategoricas.store';

import SmallModal from '@/components/SmallModal.vue';

import CicloAtualizacaoModalAdicionar from './CicloAtualizacaoModalAdicionar.vue';
import CicloAtualizacaoModalEditar from './CicloAtualizacaoModalEditar.vue';

import useCicloAtualizacao from './composables/useCicloAtualizacao';

type ConteudoOpcao = {
  titulo: string,
  componente: Component
};

type Opcoes = 'simples' | 'composta';

type ConteudoOpcoes = {
  [key in Opcoes]: ConteudoOpcao
};

const cicloAtualizacaoStore = useCicloAtualizacaoStore();
const variaveisCategoricasStore = useVariaveisCategoricasStore();
const { fase } = useCicloAtualizacao();

const { emFoco, temCategorica } = storeToRefs(cicloAtualizacaoStore);

const modalVisivel = ref<boolean>(true);

const $route = useRoute();
const $router = useRouter();

function fecharModal() {
  const { state } = window.history;

  if (state.back?.includes('/variaveis/ciclo-atualizacao')) {
    $router.push(state.back);
  }

  $router.push({
    name: 'cicloAtualizacao',
    query: {
      aba: 'Preenchimento',
    },
  });
}

onMounted(async () => {
  const cicloAtualizacaoId = $route.params.cicloAtualizacaoId as string;
  const dataReferencia = $route.params.dataReferencia as string;

  if (!cicloAtualizacaoId) {
    fecharModal();
  }

  try {
    await cicloAtualizacaoStore.obterCicloPorId(cicloAtualizacaoId, dataReferencia);

    if (temCategorica.value) {
      const variavelCategoricaId = emFoco.value?.variavel.variavel_categorica_id;
      if (!variavelCategoricaId) {
        throw new Error('Erro ao tentar buscar variável categorica ID');
      }

      await variaveisCategoricasStore.buscarItem(
        variavelCategoricaId,
      );
    }
  } catch (err) {
    fecharModal();
  }
});

const conteudoEscolhido = computed<ConteudoOpcao>(() => {
  let tituloBase = 'Adicionar valor realizado';
  if (fase.value === 'aprovacao') {
    tituloBase = 'Fase de Aprovação';
  } else if (fase.value === 'liberacao') {
    tituloBase = 'Fase de Liberação';
  }

  const opcoes: ConteudoOpcoes = {
    simples: {
      titulo: tituloBase,
      componente: CicloAtualizacaoModalAdicionar,
    },
    composta: {
      titulo: `${tituloBase} em Lote`,
      componente: CicloAtualizacaoModalEditar,
    },
  };

  if (cicloAtualizacaoStore.emFoco?.possui_variaveis_filhas) {
    return opcoes.composta;
  }

  return opcoes.simples;
});
</script>

<style lang="less" scoped>
.ciclo-atualizacao-editar__titulo {
  font-size: 30px;
  font-weight: 700;
  line-height: 39px;
  color: #233B5C;
  margin: 0;
}
</style>
