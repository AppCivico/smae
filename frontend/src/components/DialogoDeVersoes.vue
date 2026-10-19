<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import { useVersaoStore } from '@/stores/versao.store';
import { useWikiStore } from '@/stores/wiki.store';

import ErrorComponent from './ErrorComponent.vue';
import LoadingComponent from './LoadingComponent.vue';
import SmaeDialog from './SmaeDialog.vue';

const versaoStore = useVersaoStore();
const wikiStore = useWikiStore();

const { versao, chamadasPendentes, erro } = storeToRefs(versaoStore);
const { paginasMapeadas } = storeToRefs(wikiStore);

const linkDasNotas = computed(() => paginasMapeadas.value.versoes || null);

function aoAbrir() {
  versaoStore.buscar();
  if (!wikiStore.paginas.length) {
    wikiStore.buscar();
  }
}
</script>
<template>
  <SmaeDialog
    id="versoes"
    titulo="Lista de versões"
    @dialogo-aberto="aoAbrir"
  >
    <LoadingComponent v-if="chamadasPendentes.versao" />

    <ErrorComponent v-else-if="erro">
      {{ erro }}
    </ErrorComponent>

    <table
      v-else-if="versao"
      class="tablemain"
    >
      <thead>
        <tr>
          <th>Sistema</th>
          <th>Versão</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="servico in versao.servicos"
          :key="servico.chave"
        >
          <td>{{ servico.nome }}</td>
          <td>Versão {{ servico.versao }}</td>
        </tr>
      </tbody>
    </table>

    <div
      v-if="linkDasNotas"
      class="flex spacebetween center mt2 g1"
    >
      <hr class="f1">
      <a
        :href="linkDasNotas"
        class="btn"
        target="_blank"
        rel="noopener"
      >
        Ver detalhes
      </a>
      <hr class="f1">
    </div>
  </SmaeDialog>
</template>
