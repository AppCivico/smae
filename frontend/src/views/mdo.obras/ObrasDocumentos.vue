<script setup>
import ErrorComponent from '@/components/ErrorComponent.vue';
import GerenciadorDeArquivos from '@/components/GerenciadorDeArquivos.vue';
import LoadingComponent from '@/components/LoadingComponent.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useObrasStore } from '@/stores/obras.store';
import { storeToRefs } from 'pinia';
import {
  defineOptions,
} from 'vue';

defineOptions({ inheritAttrs: false });
defineProps({
  obraId: {
    type: [
      Number,
      String,
    ],
    default: 0,
  },
});

const alertStore = useAlertStore();

const obrasStore = useObrasStore();
const {
  chamadasPendentes,
  arquivos,
  permissõesDaObraEmFoco,
  erros,
} = storeToRefs(obrasStore);

function excluirArquivo({ id, nome }) {
  alertStore.confirmAction(`Deseja remover o arquivo "${nome}"?`, () => {
    obrasStore.excluirArquivo(id);
  }, 'Remover');
}

function iniciar() {
  obrasStore.buscarArquivos();
}

iniciar();
</script>
<template>
  <header class="flex spacebetween center mb2">
    <TítuloDePágina />

    <hr class="ml2 f1">
    <router-link
      v-if="!permissõesDaObraEmFoco.apenas_leitura || permissõesDaObraEmFoco.sou_responsavel"
      :to="{
        name: 'obrasNovoDocumento',
        params: {
          obraId
        }
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
    :apenas-leitura="permissõesDaObraEmFoco.apenas_leitura"
    :parâmetros-de-diretórios="{ projeto_id: $route.params.obraId }"
    :arquivos="arquivos"
    class="mb1"
    :rota-de-adição="{
      name: 'obrasNovoDocumento'
    }"
    :rota-de-edição="{
      name: 'obrasEditarDocumento',
    }"
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
