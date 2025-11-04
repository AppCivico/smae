<template>
  <CabecalhoDePagina>
    <template #acoes>
      <SmaeLink
        :to="{ name: 'projeto.etiquetas.criar' }"
        class="btn big"
      >
        Nova etiqueta
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <SmaeTable
    :dados="lista"
    :colunas="[
      { chave: 'descricao', label: 'Descrição' },
      { chave: 'portfolio.titulo', label: 'Portfólio' },
    ]"
    :rota-editar="({ id }) => ({
      name: 'projeto.etiquetas.editar',
      params: { etiquetaId: id }
    })"
    parametro-no-objeto-para-excluir="descricao"
    @deletar="excluirEtiqueta"
  />
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useProjetoEtiquetasStore } from '@/stores/projetoEtiqueta.store';

const alertStore = useAlertStore();
const projetoEtiquetasStore = useProjetoEtiquetasStore();
const { lista } = storeToRefs(projetoEtiquetasStore);

async function excluirEtiqueta(linha) {
  if (await projetoEtiquetasStore.excluirItem(linha.id)) {
    projetoEtiquetasStore.$reset();
    projetoEtiquetasStore.buscarTudo();
    alertStore.success(`"${linha.descricao}" removida.`);
  }
}

onMounted(() => {
  projetoEtiquetasStore.$reset();
  projetoEtiquetasStore.buscarTudo();
});
</script>

<style></style>
