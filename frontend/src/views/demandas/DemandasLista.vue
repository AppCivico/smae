<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

import DeleteButton from '@/components/SmaeTable/partials/DeleteButton.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import dinheiro from '@/helpers/dinheiro';
import { useDemandasStore } from '@/stores/demandas.store';

const demandasStore = useDemandasStore();
const { lista } = storeToRefs(demandasStore);

function buscarTudo() {
  demandasStore.$reset();
  demandasStore.buscarTudo();
}

async function excluirItem({ id }) {
  await demandasStore.excluirItem(id);

  buscarTudo();
}

onMounted(() => {
  buscarTudo();
});
</script>

<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />

    <hr class="ml2 f1">

    <SmaeLink
      :to="{ name: 'demandas.criar' }"
      class="btn big ml1"
    >
      Nova Demanda
    </SmaeLink>
  </div>

  <SmaeTable
    :dados="lista"
    :colunas="[
      { chave: 'status', label: 'status' },
      { chave: 'orgao.nome_exibicao', label: 'gestor municipal' },
      { chave: 'nome_projeto', label: 'Nome do Projeto' },
      { chave: 'area_tematica.nome', label: 'Área Temática' },
      { chave: 'valor', label: 'Valor', formatador: dinheiro },
    ]"
  >
    <template #acoes="{ linha }">
      <SmaeLink
        :to="{
          name: 'demandas.editar',
          params: { demandaId: linha.id },
        }"
      >
        <svg
          width="20"
          height="20"
        >
          <use xlink:href="#i_edit" />
        </svg>
      </SmaeLink>

      <DeleteButton
        v-if="linha.permissoes.pode_remover"
        :linha="linha"
        parametro-no-objeto-para-excluir="nome_projeto"
        @deletar="(item) => excluirItem(item)"
      />
    </template>
  </SmaeTable>
</template>
