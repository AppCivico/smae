<template>
  <header class="card-envelope-titulo">
    <h2 class="card-envelope-titulo__texto t20 mb0 center g1">
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
      class="card-envelope-titulo__texto__subtitulo t10"
    >
      <slot name="subtitulo">
        {{ subtitulo }}
      </slot>
    </p>
  </header>
</template>

<script lang="ts" setup>
import { computed, withDefaults } from 'vue';

type Slots = {
  default(): any
  icone(): any
  subtitulo(): any
};

type Props = {
  titulo?: string,
  subtitulo?: string,
  icone?: string,
  cor?: string,
};

const slots = defineSlots<Slots>();

const props = withDefaults(
  defineProps<Props>(),
  {
    titulo: undefined,
    subtitulo: undefined,
    icone: undefined,
    cor: '#221F43',
  },
);

const temIcone = computed<boolean>(() => !!props.icone || !!slots.icone);
</script>
<style lang="less" scoped>
.card-envelope-titulo__texto {
  position: relative;

  &::after {
    content: '';
    display: inline-block;
    height: 2px;
    background-color: v-bind(cor);
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0;
  }

  &::before {
    content: '';
    display: inline-block;
    height: 6px;
    width: 6px;
    border-radius: 100%;
    color: v-bind(cor);
    background-color: currentColor;
    position: absolute;
    right: 0;
    top: 50%;
    margin-top: -3px;
  }
}

.card-envelope-titulo__icone {
  background-color: v-bind(cor);
  position: absolute;
  right: 0;

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
