<script lang="ts" setup>
import { computed } from 'vue';

type PossiveisValores = string | number | null | any;

type SessaoDeDetalheLinha = {
  label: string | undefined
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

<template>
  <article
    class="flex column g2 resumo-sessao"
    :class="{'mt2': !removerDivisoria}"
  >
    <div
      v-if="!removerDivisoria"
      class="flex center g2"
    >
      <h2
        v-if="titulo"
        class="resumo-sessao__divider-titulo"
      >
        {{ titulo }}
      </h2>
      <hr

        class="f1"
      >
    </div>

    <div
      v-for="(linha, linhaIndex) in linhasMapeadas"
      :key="`resumo-linha--${linhaIndex}`"
      class="resumo-sessao__linha"
    >
      <div
        v-for="(item, itemIndex) in linha"
        :key="`resumo-item--${linhaIndex}-${itemIndex}`"
        class="flex column g1 resumo-sessao__item"
        :style="{
          'flex': item.col ?
            `0 0 calc(${item.col * 100 / obterLinhas(linha.length)}% - 1rem)`
            : `0 0 calc(${100 / obterLinhas(linha.length)}% - 1rem)`,
        }"
      >
        <h5 class="resumo-sessao__item-label tamarelo">
          {{ item.label }}
        </h5>

        <h6
          v-if="!Array.isArray(item.valor)"
          class="resumo-sessao__item-valor"
        >
          {{ item.valor || '-' }}
        </h6>

        <ul
          v-else
          class="resumo-sessao__item-valor-lista"
        >
          <li
            v-for="(opcao, opcaoIndex) in item.valor"
            :key="`linha-${linhaIndex}-item-${itemIndex}-valor-opcao--${opcaoIndex}`"
            class="resumo-sessao__item-valor-lista-item"
          >
            {{ opcao }}
          </li>
        </ul>
      </div>
    </div>
  </article>
</template>

<style lang="less" scoped>
.resumo-sessao__divider-titulo {
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  color: #B8C0CC;
  white-space: nowrap;
  margin: 0;
}

.resumo-sessao__linha {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem 0;
}

.resumo-sessao__item {
  h5, h6 {
    margin: 0;
  }
}

.resumo-sessao__item-label {
  font-weight: 700;
  font-size: 16px;
  line-height: 20px;
  color: #607A9F;
}

.resumo-sessao__item-valor {
  font-size: 14px;
  font-weight: 400;
  line-height: 18px;
  color: #233B5C;
}

.resumo-sessao__item-valor-lista-item {
  list-style: inside;
}

</style>
