<script setup>
import { useAlertStore } from '@/stores/alert.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { storeToRefs } from 'pinia';

const baseUrl = `${import.meta.env.VITE_API_URL}`;

const alertStore = useAlertStore();
const projetosStore = useProjetosStore();
const {
  chamadasPendentes,
  arquivos,
  erro,
} = storeToRefs(projetosStore);

function excluirArquivo(id) {
  alertStore.confirmAction('Deseja remover o arquivo?', () => {
    projetosStore.excluirArquivo(id);
  }, 'Remover');
}

function iniciar() {
  projetosStore.buscarArquivos();
}

iniciar();
</script>

<template>
  <table
    v-if="arquivos.length"
    class="tablemain mb1"
  >
    <caption>
      Lista de documentos
    </caption>
    <col>
    <col>
    <col class="col--botão-de-ação">
    <thead>
      <tr>
        <th>Arquivo</th>
        <th>Descrição</th>
        <th />
      </tr>
    </thead>
    <tbody>
      <template
        v-for="item in arquivos"
        :key="item.id"
      >
        <tr>
          <td
            class="cell--minimum"
            :class="{ loading: chamadasPendentes.arquivos }"
          >
            <a
              :href="baseUrl + '/download/' + item?.arquivo?.download_token"
              download
            >
              {{ item?.arquivo?.nome_original ?? '-' }}
            </a>
          </td>
          <td
            :class="{ loading: chamadasPendentes.arquivos }"
          >
            <a
              :href="baseUrl + '/download/' + item?.arquivo?.download_token"
              download
            >
              {{ item?.arquivo?.descricao ?? '-' }}
            </a>
          </td>
          <td>
            <button
              class="like-a__text"
              type="button"
              :disabled="chamadasPendentes.arquivos"
              @click="excluirArquivo(item.id)"
            >
              <svg
                width="20"
                height="20"
                arial-label="excluir"
              >
                <use xlink:href="#i_remove" />
              </svg>
            </button>
          </td>
        </tr>
      </template>
    </tbody>
  </table>

  <router-link
    :to="{
      name: 'projetosNovoDocumento'
    }"
    class="addlink mb1"
  >
    <svg
      width="20"
      height="20"
    >
      <use xlink:href="#i_+" />
    </svg>
    Adicionar arquivo
  </router-link>

  <span
    v-if="chamadasPendentes?.arquivos"
    class="spinner"
  >Carregando</span>

  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>
</template>
