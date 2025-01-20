<script setup>
import { storeToRefs } from 'pinia';
import {
  defineOptions,
} from 'vue';
import { useRoute } from 'vue-router';
import ErrorComponent from '@/components/ErrorComponent.vue';
import GerenciadorDeArquivos from '@/components/GerenciadorDeArquivos.vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import { useAlertStore } from '@/stores/alert.store';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';

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

const route = useRoute();

const alertStore = useAlertStore();

const planosSetoriaisStore = usePlanosSetoriaisStore(route.meta.entidadeMãe);
const {
  emFoco,
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
    <router-link
      v-if="emFoco?.pode_editar"
      :to="{
        name: `${route.meta.entidadeMãe}.planosSetoriaisNovoDocumento`,
        params: { planoSetorialId }
      }"
      class="btn ml2"
    >
      Novo arquivo
    </router-link>
  </header>

  <LoadingComponent
    v-if="chamadasPendentes?.arquivos"
  />

  <GerenciadorDeArquivos
    :parâmetros-de-diretórios="{ pdm_id: $route.params.planoSetorialId }"
    :arquivos="arquivos"
    class="mb1"
    :rota-de-adição="emFoco?.pode_editar
      ? {
        name: `${route.meta.entidadeMãe}.planosSetoriaisNovoDocumento`,
      }
      : null"
    :rota-de-edição="emFoco?.pode_editar
      ? {
        name: 'planosSetoriaisEditarDocumento'
      }
      : null"
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
