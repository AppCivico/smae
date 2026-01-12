<script lang="ts" setup>
import { storeToRefs } from 'pinia';

import GerenciadorDeArquivos from '@/components/GerenciadorDeArquivos.vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import { useAnexosPorVariavelStore } from '@/stores/AnexosPorVariavel.store.ts';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  // forma obsoleta de nomear props mantida para compatibilidade com rotas antigas
  // eslint-disable-next-line vue/prop-name-casing
  meta_id: {
    type: Number,
    default: 0,
  },
  // eslint-disable-next-line vue/prop-name-casing
  iniciativa_id: {
    type: Number,
    default: 0,
  },
  // eslint-disable-next-line vue/prop-name-casing
  atividade_id: {
    type: Number,
    default: 0,
  },
});

const anexosPorVariavelStore = useAnexosPorVariavelStore();
const {
  chamadasPendentes,
  erros,
  listaConvertida,
} = storeToRefs(anexosPorVariavelStore);

function iniciar() {
  const params: Record<string, number> = {};
  if (props.meta_id) {
    params.meta_id = props.meta_id;
  } else if (props.iniciativa_id) {
    params.iniciativa_id = props.iniciativa_id;
  } else if (props.atividade_id) {
    params.atividade_id = props.atividade_id;
  }

  anexosPorVariavelStore.buscarTudo(params);
}

iniciar();
</script>
<template>
  <CabecalhoDePagina />

  <LoadingComponent v-if="chamadasPendentes?.lista" />

  <ErrorComponent
    v-else-if="erros?.lista"
    :erro="erros?.lista"
    class="mb1"
  />

  <GerenciadorDeArquivos
    :arquivos="listaConvertida"
    class="mb1"
    :apenas-leitura="true"
  >
    <template #nome-diretorio="{ diretorio, nivel }">
      <template v-if="nivel === 0">
        variável
      </template>
      <template v-else-if="nivel === 1">
        ciclo
      </template>
      {{ diretorio?.nome }}
    </template>
  </GerenciadorDeArquivos>
</template>
