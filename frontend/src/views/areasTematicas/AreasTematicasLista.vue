<script setup>
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useAreasTematicasStore } from '@/stores/areasTematicas.store';

const areasTematicasStore = useAreasTematicasStore();
const alertStore = useAlertStore();

const { lista } = storeToRefs(areasTematicasStore);

// Ordenação: ativos primeiro, depois alfabética
const listaOrdenada = computed(() => {
  const listaClone = [...lista.value];

  listaClone.sort((a, b) => {
    if (a.ativo !== b.ativo) return b.ativo ? 1 : -1;
    return a.nome.localeCompare(b.nome);
  });

  return listaClone;
});

async function excluirArea(linha) {
  try {
    const resultado = await areasTematicasStore.excluirItem(linha.id);

    if (resultado) {
      areasTematicasStore.$reset();
      areasTematicasStore.buscarTudo();
      alertStore.success(`Área temática "${linha.nome}" removida.`);
    } else {
      alertStore.error(`Falha ao remover a área temática "${linha.nome}".`);
    }
  } catch (error) {
    alertStore.error(error);
  }
}

onMounted(() => {
  areasTematicasStore.$reset();
  areasTematicasStore.buscarTudo();
});
</script>

<template>
  <CabecalhoDePagina>
    <template #acoes>
      <SmaeLink
        :to="{ name: 'areasTematicas.criar' }"
        class="btn big"
      >
        Nova área temática
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <LoadingComponent v-if="areasTematicasStore.chamadasPendentes.lista" />
  <SmaeTable
    v-else
    :dados="listaOrdenada"
    :colunas="[
      { chave: 'nome', label: 'Área' },
      { chave: 'ativo', label: 'Ativo' },
    ]"
    :rota-editar="({ id }) => ({
      name: 'areasTematicas.editar',
      params: { areaTematicaId: id }
    })"
    parametro-no-objeto-para-excluir="nome"
    @deletar="excluirArea"
  >
    <template #celula:ativo="{ linha }">
      {{ linha.ativo ? 'Sim' : 'Não' }}
    </template>
  </SmaeTable>
</template>
