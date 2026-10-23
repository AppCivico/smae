<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import type { Colunas, Linhas } from '@/components/SmaeTable/tipagem';
import { useVersaoStore } from '@/stores/versao.store';
import { useWikiStore } from '@/stores/wiki.store';

import ErrorComponent from './ErrorComponent.vue';
import LoadingComponent from './LoadingComponent.vue';
import SmaeDialog from './SmaeDialog.vue';

const versaoStore = useVersaoStore();
const wikiStore = useWikiStore();

const { versao, chamadasPendentes, erro } = storeToRefs(versaoStore);
const { paginasMapeadas } = storeToRefs(wikiStore);

const colunas: Colunas = [
  { chave: 'nome', label: 'Sistema' },
  {
    chave: 'versao',
    label: 'Versão',
    atributosDaColuna: {
      class: 'col--minimum',
    },
  },
];

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

    <SmaeTable
      v-else-if="versao"
      :colunas="colunas"
      :dados="versao.servicos as unknown as Linhas"
      campo-id="chave"
    />

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
