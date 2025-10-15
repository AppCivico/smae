<script setup>
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useTipoDeVinculoStore } from '@/stores/tipoDeVinculo.store';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';

const tipodeVinculoStore = useTipoDeVinculoStore();
const { lista } = storeToRefs(tipodeVinculoStore);

function buscarDados() {
  tipodeVinculoStore.$reset();
  tipodeVinculoStore.buscarTudo();
}

async function excluirItem({ id }) {
  await tipodeVinculoStore.excluirItem(id);

  buscarDados();
}

onMounted(() => {
  buscarDados();
});
</script>

<template>
  <div class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <SmaeLink
      :to="{ name: 'tipoDeVinculo.novo' }"
      class="btn big ml1"
    >
      Novo Tipo de Vínculo
    </SmaeLink>
  </div>

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
