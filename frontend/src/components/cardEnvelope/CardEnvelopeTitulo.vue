<template>
  <header class="card-envelope-titulo flex center">
    <div
      class="card-envelope-titulo__texto"
      :class="{ 'com-icone': temIcone }"
    >
      <slot>
        <h1 class="t20 mb0">
          {{ titulo }}
        </h1>
        <p
          v-if="subtitulo"
          class="card-envelope-titulo__texto__subtitulo t10"
        >
          {{ subtitulo }}
        </p>
      </slot>
    </div>
    <div
      v-if="temIcone"
      class="card-envelope-titulo__linha"
    />
    <div
      :class="[
        'card-envelope-titulo__icone br999 flex justifycenter center',
        {'card-envelope-titulo__icone--sem-icone': !temIcone}
      ]"
    >
      <slot name="icone">
        <svg
          width="20"
          height="20"
        >
          <use :xlink:href="`#i_${icone}`" />
        </svg>
      </slot>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { computed, withDefaults } from 'vue';

type Slots = {
  default(): any
  icone(): any
};

type Props = {
  titulo?: string,
  subtitulo?: string,
  icone?: string,
  cor?: string,
};

const $slots = defineSlots<Slots>();

const props = withDefaults(
  defineProps<Props>(),
  {
    titulo: undefined,
    subtitulo: undefined,
    icone: undefined,
    cor: '#221F43',
  },
);

const temIcone = computed<boolean>(() => !!props.icone || !!$slots.icone);
</script>

<style lang="less" scoped>
.card-envelope-titulo__linha {
  flex-grow: 1;
  height: 2px;
  background-color: v-bind(cor);
  margin-left: 10px;
}

.card-envelope-titulo__icone {
  background-color: v-bind(cor);
  width: 50px;
  height: 50px;

  svg {
    fill: @branco;
  }
}

.card-envelope-titulo__texto__subtitulo {
  color: #A2A6AB;
  max-width: 140px;
}
</style>
