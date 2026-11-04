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
          Valor da emenda
        </dt>
        <dd>{{ moeda(transferencia.valor_parlamentar) }}</dd>
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
          <td>{{ moeda(transferencia.valor_parlamentar_distribuido) }}</td>
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
  gap: 1.7rem;
  padding: 2.3rem;
  border-radius: 0.9rem;
  background-color: @branco;
  box-shadow: 0 0.7rem 1.4rem 0 fade(@primary, 10%);
  color: #233b5c;
}

.cartao-de-transferencia__cabecalho {
  display: flex;
  gap: 5.2rem;
}

.cartao-de-transferencia__objeto {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 0.3rem;
  max-width: 42.6rem;
}

.cartao-de-transferencia__rotulo {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 300;
  line-height: 1.7rem;
}

.cartao-de-transferencia__link {
  margin: 0;
  font-size: 1.4rem;
  line-height: 1.7rem;

  :deep(a) {
    color: inherit;
  }
}

.cartao-de-transferencia__valor {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  flex-shrink: 0;
  width: 10rem;
  margin: 0;

  dd {
    margin: 0;
    font-size: 1.4rem;
    line-height: 1.7rem;
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
    padding: 0 0.9rem;
    text-align: left;
    vertical-align: middle;
  }

  :deep(thead th) {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 0.1rem solid @c100;
    // `.tablemain th` aplica `.tc300`, que usa !important
    color: @primary !important;
    font-size: 0.85rem;
    font-weight: 700;
    line-height: 1.2;
    text-transform: uppercase;
  }

  :deep(tbody th),
  :deep(tbody td) {
    height: 3.6rem;
    border-bottom: 0.1rem solid @c100;
    font-size: 0.9rem;
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
    height: 3.6rem;
    font-size: 0.9rem;
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
  width: 22.7rem;
  height: 1.3rem;
  background-color: @c200;
}

.cartao-de-transferencia__barra-parlamentar {
  position: absolute;
  top: 0.6rem;
  left: 0;
  height: 0.3rem;
  border-radius: 0 0.1rem 0.1rem 0;
  background-color: @primary;
}

.cartao-de-transferencia__legenda {
  display: flex;
  gap: 3.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.1rem;
  letter-spacing: 0.0455em;
}

.cartao-de-transferencia__legenda-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
}

.cartao-de-transferencia__marcador--distribuicao {
  width: 0.8rem;
  height: 0.8rem;
  background-color: @c200;
}

.cartao-de-transferencia__marcador--parlamentar {
  width: 0.7rem;
  height: 0.3rem;
  background-color: @primary;
}
</style>
