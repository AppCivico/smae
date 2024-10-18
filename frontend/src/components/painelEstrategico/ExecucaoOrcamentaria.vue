<template>
  <div
    role="region"
    aria-label="Tabela de execução orçamentária"
    tabindex="0"
  >
    <table class="tabela-orcamentos mt1">
      <colgroup>
        <col>
        <col>
        <col>
        <col>
        <col>
      </colgroup>
      <thead>
        <tr>
          <th class="tl">
            Nome do projeto
          </th>
          <th class="tr">
            Custo planejado total (em R$)
          </th>
          <th class="tr">
            Custo planejado até a presente data (em R$)
          </th>
          <th class="tr">
            Valor empenhado total (em R$)
          </th>
          <th class="tr">
            Valor liquidado total (em R$)
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for=" (orcamento, index) in orcamentos"
          :key="index"
        >
          <td class="tl">
            {{ orcamento.nome_projeto || ' - ' }}
          </td>
          <td class="tr">
            {{ dinheiro(orcamento.valor_custo_planejado_total) || ' - ' }}
          </td>
          <td class="tr">
            {{ dinheiro(orcamento.valor_custo_planejado_hoje) || ' - ' }}
          </td>
          <td class="tr">
            {{ dinheiro(orcamento.valor_empenhado_total) || ' - ' }}
          </td>
          <td class="tr">
            {{ dinheiro(orcamento.valor_liquidado_total) || ' - ' }}
          </td>
        </tr>
      </tbody>
    </table>
    <div>
      <MenuPaginacao
        class="mt2 bgb"
        v-bind="paginacao"
        prefixo="orcamentos_"
      />
      <p class="w700 t12 tc tprimary">
        Total de orcamentos: {{ paginacao.totalRegistros }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import dinheiro from '@/helpers/dinheiro';
import MenuPaginacao from '@/components/MenuPaginacao.vue';

defineProps({
  orcamentos: {
    type: Array,
    default: () => [],
  },
  paginacao: {
    type: Object,
    default: () => ({}),
  },
});
</script>

<style scoped>
.tabela-orcamentos {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}
.tabela-orcamentos th,
.tabela-orcamentos td {
  border-bottom: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}
.tabela-orcamentos th {
  font-weight: bold;
}
</style>
