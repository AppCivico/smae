<template>
  <article
    class="flex column g2 variavei-detalhe-sessao"
    :class="{'mt2': !removerDivisoria}"
  >
    <div
      v-if="!removerDivisoria"
      class="flex center g2"
    >
      <h2
        v-if="titulo"
        class="variavei-detalhe-sessao__divider-titulo"
      >
        {{ titulo }}
      </h2>
      <hr

        class="f1"
      >
    </div>

    <div
      v-for="(linha, linhaIndex) in linhas"
      :key="`variavel-linha--${linhaIndex}`"
      class="variavei-detalhe-sessao__linha"
      :style="{
        'grid-template-columns': `repeat(${obterLinhas(linha.length)}, 1fr)`
      }"
    >
      <div
        v-for="(item, itemIndex) in linha"
        :key="`variavel-item--${linhaIndex}-${itemIndex}`"
        class="flex column g1 variavei-detalhe-sessao__item"
        :style="{
          'grid-column': item.col && `span ${item.col}`,
        }"
      >
        <h5 class="variavei-detalhe-sessao__item-label">
          {{ item.label }}
        </h5>

        <h6
          v-if="!valorEhArray(item.valor)"
          class="variavei-detalhe-sessao__item-valor"
        >
          {{ item.valor }}
        </h6>

        <ul
          v-else
          class="variavei-detalhe-sessao__item-valor-lista"
        >
          <li
            v-for="(opcao, opcaoIndex) in item.valor"
            :key="`linha-${linhaIndex}-item-${itemIndex}-valor-opcao--${opcaoIndex}`"
            class="variavei-detalhe-sessao__item-valor-lista-item"
          >
            {{ opcao }}
          </li>
        </ul>
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
type PossiveisValores = string | number | null | any;

type SessaoDeDetalheLinha = {
  label: string
  valor?: PossiveisValores
  col?: number
}[];

export type SessaoDeDetalheLinhas = SessaoDeDetalheLinha[];

type Props = {
  linhas: SessaoDeDetalheLinha[]
  removerDivisoria?: boolean
  titulo?: string
};

defineProps<Props>();

function valorEhArray(valor: PossiveisValores): boolean {
  return !!Array.isArray(valor);
}

function obterLinhas(quantidadeLinhas: number): number {
  if (quantidadeLinhas < 3) {
    return 3;
  }

  return quantidadeLinhas;
}
</script>

<style lang="less" scoped>
.variavei-detalhe-sessao__divider-titulo {
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  color: #B8C0CC;
  white-space: nowrap;
  margin: 0;
}

.variavei-detalhe-sessao__linha {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.variavei-detalhe-sessao__item {
  h5, h6 {
    margin: 0;
  }
}

.variavei-detalhe-sessao__item-label {
  font-weight: 700;
  font-size: 16px;
  line-height: 20px;
  color: #607A9F;
}

.variavei-detalhe-sessao__item-valor {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #233B5C;
}

.variavei-detalhe-sessao__item-valor-lista-item {
  list-style: inside;
}

</style>
