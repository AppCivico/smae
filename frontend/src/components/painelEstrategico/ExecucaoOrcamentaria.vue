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
              {{ projetoFormatado(orcamento.codigo_projeto, orcamento.nome_projeto) }}
            </td>
            <td class="tr">
              {{ orcamento.valor_custo_planejado_total !== undefined &&
                orcamento.valor_custo_planejado_total !== null
                ? dinheiro(orcamento.valor_custo_planejado_total) : ' - ' }}
            </td>
            <td class="tr">
              {{ orcamento.valor_custo_planejado_hoje !== undefined
                && orcamento.valor_custo_planejado_hoje !== null
                ? dinheiro(orcamento.valor_custo_planejado_hoje) : ' - ' }}

              <span
                v-if="orcamento.ha_anos_nulos"
                class="tipinfo tabela-orcamentos__info"
              >
                <svg
                  width="16"
                  height="16"
                >
                  <use xlink:href="#i_i" />
                </svg>
                <div>Existem custos planejados sem data</div>
              </span>
              {{ }}
            </td>
            <td class="tr">
              {{ orcamento.valor_empenhado_total !== undefined
                && orcamento.valor_empenhado_total !== null
                ? dinheiro(orcamento.valor_empenhado_total) : ' - ' }}
            </td>
            <td class="tr">
              {{ orcamento.valor_liquidado_total !== undefined &&
                orcamento.valor_liquidado_total !== null
                ? dinheiro(orcamento.valor_liquidado_total) : ' - ' }}
            </td>
            <td>
              <div class="grafico">
                <div
                  class="grafico__liquidado"
                  :style="{
                    width: obterValorTamanho(orcamento,orcamento.valor_liquidado_total)
                  }"
                />
                <div
                  class="grafico__empenho"
                  :style="{
                    width: obterValorTamanho(orcamento, orcamento.valor_empenhado_total)
                  }"
                />
                <div
                  class="grafico__planejado-total"
                  :style="{
                    width: obterValorTamanho(orcamento, orcamento.valor_custo_planejado_total)
                  }"
                />
                <div
                  class="grafico__planejado"
                  :style="{
                    width: obterValorTamanho(orcamento,orcamento.valor_custo_planejado_hoje)
                  }"
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
      <tfoot>
        <td colspan="5" />
        <td>
          <dl
            class="legendas mt1"
          >
            <div class="legenda-item">
              <dd class="custo-planejado-total" />
              <dt>Custo Planejado Total</dt>
            </div>
            <div class="legenda-item">
              <dd class="custo-planejado" />
              <dt>Custo Planejado até a Presente Data</dt>
            </div>
            <div class="legenda-item">
              <dd class="valor-empenhado" />
              <dt>Valor Empenhado Total</dt>
            </div>
            <div class="legenda-item">
              <dd class="valor-liquidado" />
              <dt>Valor Liquidado Total</dt>
            </div>
          </dl>
        </td>
      </tfoot>
    </table>
    <div class="flex justifycenter">
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
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import dinheiro from '@/helpers/dinheiro';
import truncate from '@/helpers/truncate';
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

const projetoFormatado = (codigo, nome) => {
  if (codigo && nome) {
    return `${codigo} - ${truncate(nome, 40)}`;
  }
  return codigo || nome || ' - ';
};

function obterValorTamanho(orcamento, valor) {
  const tamanho = calcularPorcentagem(
    valor,
    calcularMaiorValor(orcamento),
  );

  return `${tamanho}%`;
}
</script>

<style scoped lang="less">
.tabela-orcamentos {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
}

.tabela-orcamentos tbody th,
.tabela-orcamentos tbody td {
  border-bottom: 1px solid #ddd;
}

.tabela-orcamentos th,
.tabela-orcamentos td {
  padding: 8px;
}

.tabela-orcamentos th {
  font-weight: bold;
}

.tabela-orcamentos__info {
  color: #3976C2;
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

.legendas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 0.5em;
}

.legenda-item {
  display: flex;
  align-items: center;
}

dt {
  font-weight: bold;
  margin-left: 5px;
}

dd {
  width: 20px;
  height: 10px;
  margin: 0;
}

.custo-planejado-total {
  border-right: 2px solid #123753;
}

.custo-planejado {
  background-color: #DBDBDC;
}

.valor-empenhado {
  background-color: #F1D7BB;
}

.valor-liquidado {
  background-color: #D86B2C;
}

</style>
