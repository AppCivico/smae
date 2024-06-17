<script setup>
import GerenciadorDeArquivos from '@/components/GerenciadorDeArquivos.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';

const alertStore = useAlertStore();
const projetosStore = useProjetosStore();
const {
  chamadasPendentes,
  arquivos,
  diretórios,
  erro,
  permissõesDoProjetoEmFoco,
} = storeToRefs(projetosStore);

function excluirArquivo({ id, nome }) {
  alertStore.confirmAction(`Deseja remover o arquivo "${nome}"?`, () => {
    projetosStore.excluirArquivo(id);
  }, 'Remover');
}

function iniciar() {
  projetosStore.buscarDiretórios();
  projetosStore.buscarArquivos();
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
    :arquivos="arquivos"
    :diretórios="diretórios"
    class="mb1"
    :apenas-leitura="permissõesDoProjetoEmFoco.apenas_leitura
      && !permissõesDoProjetoEmFoco.sou_responsavel"
    :rota-de-adição="{
      name: 'projetosNovoDocumento'
    }"
    :rota-de-edição="{
      name: 'projetosEditarDocumento'
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
