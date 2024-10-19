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
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-if="chamadasPendentes">
          <td
            colspan="6"
            aria-busy="true"
          >
            <LoadingComponent />
          </td>
        </tr>
        <template v-else-if="orcamentos.length">
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
            <td>
              <div class="grafico">
                <div
                  class="grafico__liquidado"
                  :style="{ width: calcularPorcentagem(orcamento.valor_liquidado_total, calcularMaiorValor(orcamento)) + '%' }"
                />
                <div
                  class="grafico__empenho"
                  :style="{ width: calcularPorcentagem(orcamento.valor_empenhado_total, calcularMaiorValor(orcamento)) + '%' }"
                />
                <div
                  class="grafico__planejado-total"
                  :style="{ width: calcularPorcentagem(orcamento.valor_custo_planejado_total, calcularMaiorValor(orcamento)) + '%' }"
                />
                <div
                  class="grafico__planejado"
                  :style="{ width: calcularPorcentagem(orcamento.valor_custo_planejado_hoje, calcularMaiorValor(orcamento)) + '%' }"
                />
              </div>
            </td>
          </tr>
        </template>
        <tr v-else>
          <td colspan="6">
            Nenhum resultado encontrado.
          </td>
        </tr>

        <tr v-if="erro">
          <td colspan="6">
            Erro: {{ erro }}
          </td>
        </tr>
      </tbody>
    </table>
    <div>
      <MenuPaginacao
        class="mt2 bgt"
        v-bind="paginacao"
        prefixo="orcamentos_"
      />
      <p class="w700 t12 tc tprimary">
        Total de orçamentos: {{ paginacao.totalRegistros }}
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
  chamadasPendentes: {
    type: Boolean,
    default: false,
  },
  erro: {
    type: [String, Object],
    default: null,
  },
});

function calcularMaiorValor(orcamento) {
  const valores = [
    orcamento.valor_custo_planejado_total,
    orcamento.valor_custo_planejado_hoje,
    orcamento.valor_empenhado_total,
    orcamento.valor_liquidado_total,
  ];

  return Math.max(...valores);
}

function calcularPorcentagem(valor, maiorValor) {
  if (!maiorValor || !valor) {
    return 0;
  }
  return (valor / maiorValor) * 100;
}

</script>

<style scoped lang="less">
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

.grafico {
  min-width: 300px;
  min-height: 1.5em;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
}

.grafico__empenho {
  background-color: #F1D7BB;
  height: 100%;
  position: absolute;
  z-index: 2;
}

.grafico__planejado-total {
  border-right: 2px solid #123753;
  height: 100%;
  position: absolute;
  z-index: 3;

}

.grafico__planejado {
  background-color: #DBDBDC;
  height: 100%;
  position: absolute;
  z-index: 1;

}

.grafico__liquidado {
  background-color: #D86B2C;
  height: 4px;
  border-radius: 0 999em 999em 0;
  z-index: 4;
}
</style>
