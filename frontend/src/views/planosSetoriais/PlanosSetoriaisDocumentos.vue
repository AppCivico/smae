<script setup>
import ErrorComponent from '@/components/ErrorComponent.vue';
import GerenciadorDeArquivos from '@/components/GerenciadorDeArquivos.vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import { useAlertStore } from '@/stores/alert.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { storeToRefs } from 'pinia';
import {
  defineOptions,
} from 'vue';

defineOptions({ inheritAttrs: false });
defineProps({
  planoSetorialId: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
});

const alertStore = useAlertStore();

const planosSetoriaisStore = usePlanosSetoriaisStore();
const {
  chamadasPendentes,
  arquivos,
  erros,
} = storeToRefs(planosSetoriaisStore);

function excluirArquivo({ id, nome }) {
  alertStore.confirmAction(`Deseja remover o arquivo "${nome}"?`, () => {
    planosSetoriaisStore.excluirArquivo(id);
  }, 'Remover');
}

function iniciar() {
  planosSetoriaisStore.buscarArquivos();
}

iniciar();
</script>
<template>
  <header class="flex spacebetween center mb2">
    <TítuloDePágina />

    <hr class="ml2 f1">
  </header>

  <LoadingComponent
    v-if="chamadasPendentes?.arquivos"
  />

  <GerenciadorDeArquivos
    :parâmetros-de-diretórios="{ pdm_id: $route.params.planoSetorialId }"
    :arquivos="arquivos"
    class="mb1"
    @apagar="($params) => excluirArquivo($params)"
  />

  <router-view />

  <LoadingComponent
    v-if="chamadasPendentes?.arquivos"
  />

  <ErrorComponent
    v-if="erros.arquivos"
  >
    {{ erros.arquivos }}
  </ErrorComponent>
</template>
