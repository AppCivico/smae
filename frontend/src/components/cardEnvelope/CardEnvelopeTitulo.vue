<script lang="ts" setup>
import { computed, useSlots, withDefaults } from 'vue';

type Props = {
  titulo?: string,
  subtitulo?: string,
  icone?: string,
  cor?: string,
  corBolinha?: string,
  estilo?: 'padrao' | 'com-marcador',
};

const props = withDefaults(
  defineProps<Props>(),
  {
    titulo: undefined,
    subtitulo: undefined,
    icone: undefined,
    cor: '#221F43',
    corBolinha: undefined,
    estilo: 'padrao',
  },
);

const slots = useSlots();

const temIcone = computed<boolean>(() => !!props.icone || !!slots.icone);
const corBolinhaComputada = computed<string>(() => props.corBolinha || props.cor);
</script>

<template>
  <header class="card-envelope-titulo">
    <h2
      class="card-envelope-titulo__texto t20 mb0 center g1"
      :class="{ 'card-envelope-titulo__texto--com-marcador': estilo === 'com-marcador' }"
    >
      <span class="card-envelope-titulo__slot">
        <slot>
          {{ titulo }}
        </slot>
      </span>
      <slot name="icone">
        <svg
          v-if="temIcone"
          width="45"
          height="45"
          class="card-envelope-titulo__icone br999"
        >
          <use
            :xlink:href="`#i_${icone}`"
            class="card-envelope-titulo__icone__svg"
          />
        </svg>
      </slot>
    </h2>
    <p
      v-if="$slots?.subtitulo || subtitulo"
      class="card-envelope-titulo__texto__subtitulo t14"
    >
      <slot name="subtitulo">
        {{ subtitulo }}
      </slot>
    </p>
  </header>
</template>
<style lang="less" scoped>
.card-envelope-titulo__texto {
  display: grid;
  grid-template-columns: auto 1fr auto;
  justify-items: center;
  align-items: center;

  &::before {
    content: '';
    display: inline-block;
    height: 6px;
    width: 6px;
    border-radius: 100%;
    color: v-bind(cor);
    background-color: currentColor;
    grid-column: 3 / 4;
    grid-row: 1 / 2;
  }

  &::after {
    content: '';
    display: block;
    width: 100%;
    height: 2px;
    background-color: v-bind(cor);
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }
}

.card-envelope-titulo__texto--com-marcador {
  font-weight: 300;
  font-size: 2rem;
  line-height: 1.3;

  .card-envelope-titulo__slot {
    position: relative;
    display: flex;
    align-items: center;

    &::before {
      content: '';
      width: 20px;
      height: 20px;
      background-color: v-bind(corBolinhaComputada);
      border-radius: 100%;
      border: 5px solid white;
      outline: 1px solid #b8c0cc;
      margin-right: 14px;
    }

    &::after {
      content: '';
      position: absolute;
      left: 30px;
      width: 10px;
      height: 1px;
      background-color: #b8c0cc;
    }
  }
}

.card-envelope-titulo__slot {
  padding-right: 1rem;
}

.card-envelope-titulo__slot:not(:has(>strong)) {
  font-weight: bold;
}

.card-envelope-titulo__icone {
  width: max-content;
  grid-column: 3 / 4;
  grid-row: 1 / 2;
  background-color: v-bind(cor);

  svg {
    fill: @branco;
  }
}

.card-envelope-titulo__icone__svg {
  scale: 0.7;
  transform-origin: center;
}

.card-envelope-titulo__texto__subtitulo {
  color: #A2A6AB;
  max-width: 25em;
  margin-top: 0.5rem;
}
</style>
