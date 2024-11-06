<template>
  <article
    class="flex column g2 variavel-detalhe-sessao"
    :class="{'mt2': !removerDivisoria}"
  >
    <div
      v-if="!removerDivisoria"
      class="flex center g2"
    >
      <h2
        v-if="titulo"
        class="variavel-detalhe-sessao__divider-titulo"
      >
        {{ titulo }}
      </h2>
      <hr

        class="f1"
      >
    </div>

    <div
      v-for="(linha, linhaIndex) in linhasMapeadas"
      :key="`variavel-linha--${linhaIndex}`"
      class="variavel-detalhe-sessao__linha"
      :style="{
        'grid-template-columns': `repeat(${obterLinhas(linha.length)}, 1fr)`
      }"
    >
      <div
        v-for="(item, itemIndex) in linha"
        :key="`variavel-item--${linhaIndex}-${itemIndex}`"
        class="flex column g1 variavel-detalhe-sessao__item"
        :style="{
          'grid-column': item.col && `span ${item.col}`,
        }"
      >
        <h5 class="variavel-detalhe-sessao__item-label">
          {{ item.label }}
        </h5>

        <h6
          v-if="!valorEhArray(item.valor)"
          class="variavel-detalhe-sessao__item-valor"
        >
          {{ item.valor }}
        </h6>

        <ul
          v-else
          class="variavel-detalhe-sessao__item-valor-lista"
        >
          <li
            v-for="(opcao, opcaoIndex) in item.valor"
            :key="`linha-${linhaIndex}-item-${itemIndex}-valor-opcao--${opcaoIndex}`"
            class="variavel-detalhe-sessao__item-valor-lista-item"
          >
            {{ opcao }}
          </li>
        </ul>
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

type PossiveisValores = string | number | null | any;

type SessaoDeDetalheLinha = {
  label: string
  valor?: PossiveisValores
  col?: number
  esconder?: boolean
}[];

export type SessaoDeDetalheLinhas = SessaoDeDetalheLinha[];

type Props = {
  linhas: SessaoDeDetalheLinhas
  removerDivisoria?: boolean
  titulo?: string
  quantidadeColunas?: number
};

const props = defineProps<Props>();

const linhasMapeadas = computed<SessaoDeDetalheLinhas>(() => (
  props.linhas.map((linha) => linha.filter((item) => !item.esconder))
));

function valorEhArray(valor: PossiveisValores): boolean {
  return !!Array.isArray(valor);
}

function obterLinhas(quantidadeLinhas: number): number {
  if (props.quantidadeColunas) {
    return props.quantidadeColunas;
  }

  if (quantidadeLinhas < 3) {
    return 3;
  }

  return quantidadeLinhas;
}
</script>

<style lang="less" scoped>
.variavel-detalhe-sessao__divider-titulo {
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  color: #B8C0CC;
  white-space: nowrap;
  margin: 0;
}

.variavel-detalhe-sessao__linha {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem 0;
}

.variavel-detalhe-sessao__item {
  h5, h6 {
    margin: 0;
  }
}

.variavel-detalhe-sessao__item-label {
  font-weight: 700;
  font-size: 16px;
  line-height: 20px;
  color: #607A9F;
}

.variavel-detalhe-sessao__item-valor {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #233B5C;
}

.variavel-detalhe-sessao__item-valor-lista-item {
  list-style: inside;
}

</style>
