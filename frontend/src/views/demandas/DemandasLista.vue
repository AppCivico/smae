<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';

import ListaLegendas from '@/components/ListaLegendas.vue';
import DeleteButton from '@/components/SmaeTable/partials/DeleteButton.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import dinheiro from '@/helpers/dinheiro';
import truncate from '@/helpers/texto/truncate';
import { useDemandasStore } from '@/stores/demandas.store';

const legendas = {
  status: [
    { id: 'Registro', item: 'Registrada', color: '#9F045F' },
    { id: 'Validacao', item: 'Validada', color: '#F2890D' },
    { id: 'Publicado', item: 'Publicada', color: '#4074BF' },
    { id: 'Encerrado-Cancelada', item: 'Encerrada (Cancelada)', color: '#EE3B2B' },
    { id: 'Encerrado-Concluido', item: 'Encerrada (Concluída)', color: '#8EC122' },
  ],
};

const demandasStore = useDemandasStore();
const { lista } = storeToRefs(demandasStore);

function buscarTudo() {
  demandasStore.$reset();
  demandasStore.buscarTudo();
}

function corDoStatus({ status, situacao_encerramento }): string | undefined {
  let nomeStatus = status;
  if (nomeStatus === 'Encerrado' && situacao_encerramento) {
    nomeStatus += `-${situacao_encerramento}`;
  }

  return legendas.status.find((l) => l.id === nomeStatus)?.color;
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

  <ListaLegendas
    :titulo="''"
    :legendas="legendas"
    :borda="false"
    align="left"
    orientacao="horizontal"
  />

  <SmaeTable
    class="relative"
    :dados="lista"
    :colunas="[
      { chave: 'orgao.nome_exibicao', label: 'gestor municipal' },
      { chave: 'nome_projeto', label: 'Nome do Projeto' },
      { chave: 'area_tematica.nome', label: 'Área Temática' },
      { chave: 'valor', label: 'Valor', formatador: v => dinheiro(v, { style: 'currency' }) },
      { chave: 'localizacao', label: 'Localizacao', formatador: v => truncate(v, 110) },
    ]"
  >
    <template #celula:orgao__nome_exibicao="{linha}">
      <span
        class="status"
        :style="{ color: corDoStatus(linha) }"
        :title="[linha.status, linha.situacao_encerramento].join(' ')"
      />

      {{ linha.orgao.nome_exibicao }}
    </template>

    <template #acoes="{ linha }">
      <div class="flex g1 justifyleft wfull">
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
      </div>
    </template>
  </SmaeTable>
</template>

<style lang="less" scoped>
:deep(.smae-table__linha) {
  position: relative;
}

.status {
  position: absolute;
  display: block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background-color: currentColor;
  left: -20px;
  align-self: center;

}
</style>
