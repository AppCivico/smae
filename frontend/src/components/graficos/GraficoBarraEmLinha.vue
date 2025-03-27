<script setup lang="ts">
import { computed } from 'vue';
import * as CardEnvelope from '../cardEnvelope';
import NumeroComLegenda from '../painelEstrategico/NumeroComLegenda.vue';

type VariavelItem = {
  legenda: string;
  valor: number;
  posicao?: number;
  cor: string;
};

type VariavelItemComChave = VariavelItem & {
  chave: string;
  posicao: number;
};

export type ListaVariaveis = Record<string, VariavelItem>;
type ListaVariaveisOrdenada = VariavelItemComChave[];

type Props = {
  titulo?: string;
  tamanhoNumero?: number;
  tamanhoLegenda?: number;
  variaveis: ListaVariaveis;
};

type Slots = {
  titulo(): void
  linha(props: { variaveisOrdenadas: ListaVariaveisOrdenada }): void
  numeros(props: { variaveisOrdenadas: ListaVariaveisOrdenada }): void
};

const props = withDefaults(defineProps<Props>(), {
  titulo: undefined,
  tamanhoNumero: 42,
  tamanhoLegenda: 7,
});

defineSlots<Slots>();

const variaveisOrdenadas = computed<ListaVariaveisOrdenada>(
  () => Object.keys(props.variaveis).map<VariavelItemComChave>((itemKey) => {
    const variavel = props.variaveis[itemKey];

    return {
      ...structuredClone(variavel),
      posicao: variavel.posicao || 0,
      chave: itemKey,
    };
  }).sort((a, b) => a.posicao - b.posicao),
);

const todoValorEhZero = computed<boolean>(() => {
  const temValorMaiorZero = variaveisOrdenadas.value.find((item) => item.valor !== 0);

  return !temValorMaiorZero;
});

</script>

<template>
  <section class="grafico-barra-em-linha">
    <CardEnvelope.Conteudo>
      <slot name="titulo">
        <CardEnvelope.Titulo :titulo="$props.titulo" />
      </slot>

      <article class="grafico-barra-em-linha__conteudo flex column mt3 g2">
        <slot
          name="linha"
          :variaveis-ordenadas="variaveisOrdenadas"
        >
          <dl class="grafico-barra-em-linha__linha flex fb0">
            <dd
              v-for="(variavel, variavelIndex) in variaveisOrdenadas"
              :key="`grafico-barra--${variavelIndex}`"
              class="grafico-barra-em-linha__linha-item tipinfo"
              :style="{
                backgroundColor: variavel.cor,
                flexGrow: todoValorEhZero ? 1 : variavel.valor
              }"
              :title="`${variavel.legenda}: ${variavel.valor}`"
            >
              <div class="grafico-barra-em-linha__linha-texto">
                {{ `${variavel.legenda}: ${variavel.valor}` }}
              </div>
            </dd>
          </dl>
        </slot>

        <slot
          name="numeros"
          :variaveis-ordenadas="variaveisOrdenadas"
        >
          <dl class="grafico-barra-em-linha__numeros">
            <dd
              v-for="(variavel, variavelIndex) in variaveisOrdenadas"
              :key="`grafico-barra--${variavelIndex}`"
              class="grafico-barra-em-linha__numero-item"
            >
              <NumeroComLegenda
                como-item
                :cor="variavel.cor"
                :legenda="variavel.legenda"
                :numero="variavel.valor"
                cor-de-fundo="#e8e8e866"
                :tamanho-do-numero="$props.tamanhoNumero"
                :tamanho-da-legenda="$props.tamanhoLegenda"
              />
            </dd>
          </dl>
        </slot>
      </article>
    </CardEnvelope.Conteudo>
  </section>
</template>

<style lang="less" scoped>
.grafico-barra-em-linha {
  :deep(.card-envelope-conteudo) {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
}

.grafico-barra-em-linha__linha-item {
  border: 1.5px solid #FFFFFF;
  height: 28px;
}

.grafico-barra-em-linha__linha-texto {
  text-transform: uppercase;
}

.grafico-barra-em-linha__numeros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(97px, 1fr));
  gap: 0.5rem;
}
</style>
