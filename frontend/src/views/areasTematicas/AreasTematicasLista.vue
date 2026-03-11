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

const listaOrdenada = computed(() => {
  const listaClone = [...lista.value];

  listaClone.sort((a, b) => {
    if (a.ativo !== b.ativo) return b.ativo ? 1 : -1;
    return a.nome.localeCompare(b.nome);
  });

  return listaClone.map((item) => ({
    ...item,
    acoes_ativas: item.acoes?.filter((a) => a.ativo) ?? [],
    acoes_inativas: item.acoes?.filter((a) => !a.ativo) ?? [],
  }), {});
});

async function excluirArea(linha) {
  try {
    const resultado = await areasTematicasStore.excluirItem(linha.id);

    if (resultado) {
      areasTematicasStore.$reset();
      areasTematicasStore.buscarTudo();
      alertStore.success(`Área temática "${linha.nome}" removida.`);
    }
  } catch (error) {
    console.error(error);
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
    class="area-tematica__tabela"
    :dados="listaOrdenada"
    :colunas="[
      { chave: 'nome', label: 'Área' },
      { chave: 'ativo', label: 'Área ativa' },
      { chave: 'acoes_ativas', label: 'ações ativas' },
      { chave: 'acoes_inativas', label: 'ações inativas' },
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

    <template #celula:acoes_ativas="{ linha }">
      <ul v-if="linha.acoes_ativas.length">
        <li
          v-for="acao in linha.acoes_ativas"
          :key="acao.id"
        >
          {{ acao.nome }}
        </li>
      </ul>

      <span v-else />
    </template>

    <template #celula:acoes_inativas="{ linha }">
      <ul v-if="linha.acoes_inativas.length">
        <li
          v-for="acao in linha.acoes_inativas"
          :key="acao.id"
        >
          {{ acao.nome }}
        </li>
      </ul>

      <span v-else />
    </template>
  </SmaeTable>
</template>

<style lang="less" scoped>
.area-tematica__tabela {
  :deep {
    .table-cell--acoes_ativas,
    .table-cell--acoes_inativas {
      vertical-align: top;
    }

    ul, li {
      list-style: disc;
    }
  }
}
</style>
