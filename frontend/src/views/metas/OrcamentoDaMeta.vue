<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

import SmaeDescriptionList from '@/components/SmaeDescriptionList.vue';
import dinheiro from '@/helpers/dinheiro';
import { useMetasStore } from '@/stores/metas.store';

const metaStore = useMetasStore();

const { singleMeta } = storeToRefs(metaStore);

const listaOrcamento = computed(() => [
  {
    chave: 'total_previsao',
    titulo: 'Total da previsão de custo',
    valor: dinheiro(singleMeta.value?.orcamento?.total_previsao),
  },
  {
    chave: 'total_empenhado',
    titulo: 'Total empenho',
    valor: dinheiro(singleMeta.value?.orcamento?.total_empenhado),
  },
  {
    chave: 'total_liquidado',
    titulo: 'Total liquidado',
    valor: dinheiro(singleMeta.value?.orcamento?.total_liquidado),
  },
]);

const dadosTabela = computed(() => [
  {
    id: 'Atividades',
    total_previsao_custo: singleMeta.value?.orcamento?.total_previsao_atividade,
    total_empenho: singleMeta.value?.orcamento?.total_empenhado_atividade,
    total_liquidado: singleMeta.value?.orcamento?.total_liquidado_atividade,
  },
  {
    id: 'Projetos',
    total_previsao_custo: singleMeta.value?.orcamento?.total_previsao_projeto,
    total_empenho: singleMeta.value?.orcamento?.total_empenhado_projeto,
    total_liquidado: singleMeta.value?.orcamento?.total_liquidado_projeto,
  },
]);
</script>

<template>
  <h4>Orçamento</h4>

  <SmaeDescriptionList :lista="listaOrcamento" />

  <div class="tabela-orcamento mt4">
    <table>
      <colgroup>
        <col>
        <col>
        <col>
        <col>
      </colgroup>

      <thead>
        <tr>
          <th />
          <th>Total da previsão de custo</th>
          <th>Total empenho</th>
          <th>Total liquidado</th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="dadosItem in dadosTabela"
          :key="`id--${dadosItem.id}`"
        >
          <th>{{ dadosItem.id }}</th>
          <td>{{ dinheiro(dadosItem.total_previsao_custo, { style: 'currency' }) || '-' }}</td>
          <td>{{ dinheiro(dadosItem.total_empenho, { style: 'currency' }) || '-' }}</td>
          <td>{{ dinheiro(dadosItem.total_liquidado, { style: 'currency' }) || '-' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="less" scoped>
.tabela-orcamento {
  width: 100%;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0px 9.66px 19.32px 0px #1527411A;

  table {
    width: 100%;

    tbody, thead {
      * {
        text-align: left;
      }
    }

    thead th {
      color: #B8C0CC;
      text-transform: uppercase;
      padding-left: 5px;
      padding-bottom: 6.7px;
    }

    tbody tr {
      height: 50px;
    }

    tbody th {
      text-align: right !important;
      font-weight: 500;
      font-size: 1rem;
      color: #3B5881;
      text-transform: uppercase;
    }

    tbody td {
      border: 1px solid #E3E5E8;
      border-left: 0;
      border-right: 0;

      padding-left: 12px;

      color: #152741;
      font-weight: 400;
      font-size: 0.745rem;
    }
  }
}
</style>
