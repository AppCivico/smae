<script setup>
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useTipoDeVinculoStore } from '@/stores/tipoDeVinculo.store';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';

const tipoDeVinculoStore = useTipoDeVinculoStore();
const { lista } = storeToRefs(tipoDeVinculoStore);

function buscarDados() {
  tipoDeVinculoStore.$reset();
  tipoDeVinculoStore.buscarTudo();
}

async function excluirItem({ id }) {
  try {
    await tipoDeVinculoStore.excluirItem(id);
    await buscarDados();
  } catch (e) {
    console.error('Falha ao tentar excluir tipo de vínculo', e);
  }
}

onMounted(() => {
  buscarDados();
});
</script>

<template>
  <CabecalhoDePagina>
    <template #acoes>
      <SmaeLink
        :to="{ name: 'tipoDeVinculo.novo' }"
        class="btn big ml1"
      >
        Novo Tipo de Vínculo
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <SmaeTable
    :colunas="[
      { chave: 'nome', label: 'Nome' }
    ]"
    parametro-no-objeto-para-excluir="nome"
    :dados="lista"
    :rota-editar="({ id }) => ({
      name: 'tipoDeVinculo.editar',
      params: { tipoVinculoId: id}
    })"
    @deletar="excluirItem"
  />
</template>
