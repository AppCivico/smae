<script setup>
import GerenciadorDeArquivos from '@/components/GerenciadorDeArquivos.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import { storeToRefs } from 'pinia';

const alertStore = useAlertStore();
const transferenciasStore = useTransferenciasVoluntariasStore();

const {
  chamadasPendentes,
  arquivos,
  diretórios,
  erro,
} = storeToRefs(transferenciasStore);

function excluirArquivo({ id, nome }) {
  alertStore.confirmAction(`Deseja remover o arquivo "${nome}"?`, () => {
    transferenciasStore.excluirArquivo(id);
  }, 'Remover');
}

function iniciar() {
  transferenciasStore.buscarDiretórios();
  transferenciasStore.buscarArquivos();
}

iniciar();
</script>
<template>
  <div
    v-if="chamadasPendentes?.arquivos"
    class="spinner mb1"
  >
    Carregando
  </div>

  <GerenciadorDeArquivos
    :diretórios="diretórios"
    class="mb1"
    :arquivos="arquivos"
    :rota-de-adição="{
      name: 'TransferenciasVoluntariasEnviarArquivo',
    }"
    :rota-de-edição="{
      name: 'transferenciaEditarDocumento',
    }"
    @apagar="($params) => excluirArquivo($params)"
  />

  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>

  <div
    v-if="chamadasPendentes?.arquivos"
    class="spinner mb1"
  >
    Carregando
  </div>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
