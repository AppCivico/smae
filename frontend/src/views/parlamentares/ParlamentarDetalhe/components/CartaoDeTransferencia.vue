<script setup lang="ts">
import type { PainelParlamentarTransferenciaDto } from '@back/casa-civil/painel-parlamentar/entities/painel-parlamentar.entity';

import SmaeLink from '@/components/SmaeLink.vue';
import SmaeTable from '@/components/SmaeTable/SmaeTable.vue';
import type { Colunas } from '@/components/SmaeTable/tipagem';
import dinheiro from '@/helpers/dinheiro';

defineProps<{
  transferencia: PainelParlamentarTransferenciaDto;
}>();

const moeda = (valor: unknown) => dinheiro(valor, { style: 'currency' });

const colunas: Colunas = [
  {
    chave: 'nome',
    label: 'Distribuição',
    ehCabecalho: true,
    atributosDaCelula: { scope: 'row' },
    atributosDaColuna: { class: 'col--distribuicao' },
  },
  {
    chave: 'orgao.sigla',
    label: 'Órgão',
    atributosDaColuna: { class: 'col--orgao' },
  },
  {
    chave: 'situacao',
    label: 'Situação da distribuição',
    formatador: (situacao) => (situacao as string) || '—',
    atributosDaColuna: { class: 'col--situacao' },
  },
  {
    chave: 'valor',
    label: 'Valor da distribuição',
    formatador: moeda,
    atributosDaColuna: { class: 'col--valor' },
  },
  {
    chave: 'valor_parlamentar',
    label: 'Valor do parlamentar',
    formatador: moeda,
    atributosDaColuna: { class: 'col--valor' },
  },
  {
    chave: 'pct_parlamentar',
    label: 'Valor investido pelo parlamentar nesta distribuição',
    atributosDaColuna: { class: 'col--investimento' },
  },
];

const larguraDoParlamentar = (percentual: number) => `${Math.min(Math.max(percentual, 0), 100)}%`;

const descricaoDaBarra = (percentual: number) => `${dinheiro(percentual, { semDecimais: true })}% da distribuição`;
</script>

<template>
  <h1>here</h1>
  <article class="cartao-de-transferencia">
    <header class="cartao-de-transferencia__cabecalho">
      <div class="cartao-de-transferencia__objeto">
        <p class="cartao-de-transferencia__rotulo">
          Transferência {{ transferencia.identificador }}
        </p>

        <p class="cartao-de-transferencia__link">
          <SmaeLink
            :to="{
              name: 'TransferenciasVoluntariasDetalhes',
              params: { transferenciaId: transferencia.id },
            }"
            exibir-desabilitado
          >
            {{ transferencia.objeto }}
          </SmaeLink>
        </p>
      </div>

      <dl class="cartao-de-transferencia__valor">
        <dt class="cartao-de-transferencia__rotulo">
          Valor do repasse
        </dt>
        <dd>{{ moeda(transferencia.valor_repasse) }}</dd>
      </dl>

      <dl class="cartao-de-transferencia__valor">
        <dt class="cartao-de-transferencia__rotulo">
          Valor distribuído
        </dt>
        <dd>{{ moeda(transferencia.valor_distribuido) }}</dd>
      </dl>
    </header>

    <SmaeTable
      class="cartao-de-transferencia__tabela"
      :atributos-da-tabela="{ class: 'no-zebra' }"
      :colunas="colunas"
      :dados="transferencia.distribuicoes"
      :personalizar-linhas="{
        parametro: 'contabilizada',
        alvo: false,
        classe: 'cartao-de-transferencia__linha--nao-contabilizada',
      }"
    >
      <template
        v-if="!transferencia.distribuicoes.length"
        #corpo
      >
        <tr>
          <td colspan="6">
            Nenhuma distribuição registrada.
          </td>
        </tr>
      </template>

      <template #celula:nome="{ linha }">
        {{ linha.nome || linha.objeto }}
      </template>

      <template #celula:orgao__sigla="{ linha }">
        <span :title="linha.orgao.descricao">
          {{ linha.orgao.sigla }}
        </span>
      </template>

      <template #celula:pct_parlamentar="{ linha }">
        <span
          class="cartao-de-transferencia__barra"
          role="img"
          :aria-label="descricaoDaBarra(linha.pct_parlamentar)"
        >
          <span
            class="cartao-de-transferencia__barra-parlamentar"
            :style="{ width: larguraDoParlamentar(linha.pct_parlamentar) }"
          />
        </span>
      </template>

      <template #rodape>
        <tr>
          <td colspan="3" />
          <td>{{ moeda(transferencia.valor_distribuido) }}</td>
          <td>{{ moeda(transferencia.valor_parlamentar) }}</td>
          <td>
            <span class="cartao-de-transferencia__legenda">
              <span class="cartao-de-transferencia__legenda-item">
                <span class="cartao-de-transferencia__marcador--distribuicao" />
                valor da distribuição
              </span>
              <span class="cartao-de-transferencia__legenda-item">
                <span class="cartao-de-transferencia__marcador--parlamentar" />
                valor do parlamentar
              </span>
            </span>
          </td>
        </tr>
      </template>
    </SmaeTable>
  </article>
</template>

<style scoped lang="less">
.cartao-de-transferencia {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  border-radius: 12px;
  background-color: @branco;
  box-shadow: 0 9.66px 19.32px 0 fade(@primary, 10%);
  color: #233b5c;
}

.cartao-de-transferencia__cabecalho {
  display: flex;
  gap: 73px;
}

.cartao-de-transferencia__objeto {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 4px;
  max-width: 596px;
}

.cartao-de-transferencia__rotulo {
  margin: 0;
  font-size: 16px;
  font-weight: 300;
  line-height: 24px;
}

.cartao-de-transferencia__link {
  margin: 0;
  font-size: 20px;
  line-height: 24px;

  :deep(a) {
    color: inherit;
  }
}

.cartao-de-transferencia__valor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  width: 140px;
  margin: 0;

  dd {
    margin: 0;
    font-size: 20px;
    line-height: 24px;
    white-space: nowrap;
  }
}

.cartao-de-transferencia__tabela {
  :deep(table) {
    border-collapse: collapse;
    color: @primary;
  }

  :deep(tr) {
    border-bottom: 0;
  }

  :deep(th),
  :deep(td) {
    padding: 0 12px;
    text-align: left;
    vertical-align: middle;
  }

  :deep(thead th) {
    padding-top: 6.7px;
    padding-bottom: 6.7px;
    border-bottom: 0.75px solid @c100;
    // `.tablemain th` aplica `.tc300`, que usa !important
    color: @primary !important;
    font-size: 10px;
    font-weight: 700;
    line-height: 1.2;
    text-transform: uppercase;
  }

  :deep(tbody th),
  :deep(tbody td) {
    height: 50.64px;
    border-bottom: 0.75px solid @c100;
    font-size: 12px;
    line-height: 1.3;
  }

  :deep(tbody th) {
    font-weight: 700;
    line-height: 1.4;
    text-transform: none;
  }

  :deep(tfoot tr) {
    border-top: 0;
  }

  :deep(tfoot td) {
    height: 50.64px;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.3;
  }

  :deep(table th),
  :deep(table td) {
    overflow: visible;
  }

  :deep(.cartao-de-transferencia__linha--nao-contabilizada) {
    opacity: 0.5;
  }
}

.cartao-de-transferencia__barra {
  position: relative;
  display: block;
  width: 318px;
  height: 18px;
  background-color: @c200;
}

.cartao-de-transferencia__barra-parlamentar {
  position: absolute;
  top: 7.73px;
  left: 0;
  height: 4px;
  border-radius: 0 2px 2px 0;
  background-color: @primary;
}

.cartao-de-transferencia__legenda {
  display: flex;
  gap: 49px;
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.0455em;
}

.cartao-de-transferencia__legenda-item {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.cartao-de-transferencia__marcador--distribuicao {
  width: 11px;
  height: 11px;
  background-color: @c200;
}

.cartao-de-transferencia__marcador--parlamentar {
  width: 10px;
  height: 4px;
  background-color: @primary;
}
</style>
