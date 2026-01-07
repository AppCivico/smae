<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

import CabecalhoDePagina from '@/components/CabecalhoDePagina.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import { tipoEncerramento as schema } from '@/consts/formSchemas';
import { useTipoEncerramentoStore } from '@/stores/tipoEncerramento.store';

const tipoEncerramentoStore = useTipoEncerramentoStore();
const { lista } = storeToRefs(tipoEncerramentoStore);

function buscarDados(): void {
  tipoEncerramentoStore.buscarTudo();
}

async function excluirItem({ id }: { id: number }): Promise<void> {
  try {
    await tipoEncerramentoStore.excluirItem(id);
    tipoEncerramentoStore.$reset();

    buscarDados();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Falha ao tentar excluir tipo de encerramento', e);
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
        :to="{ name: 'tipoEncerramento.novo' }"
        class="btn big ml1"
      >
        Novo tipo de encerramento
      </SmaeLink>
    </template>
  </CabecalhoDePagina>

  <SmaeTable
    :colunas="[
      { chave: 'descricao' },
      { chave: 'habilitar_info_adicional', formatador: v => v ? 'Sim' : 'Não' }
    ]"
    :schema="schema"
    parametro-no-objeto-para-excluir="descricao"
    :dados="lista"
    :rota-editar="({ id }) => ({
      name: 'tipoEncerramento.editar',
      params: { tipoEncerramentoId: String(id)}
    })"
    @deletar="excluirItem"
  />
</template>
