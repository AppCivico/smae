<template>
  <header class="card-envelope-titulo flex">
    <div class="card-envelope-titulo__texto">
      <slot>
        <h1>{{ titulo }}</h1>
      </slot>
    </div>

    <div
      :class="[
        'card-envelope-titulo__icone',
        {'card-envelope-titulo__icone--sem-icone': !temIcone}
      ]"
    >
      <slot name="icone">
        <svg
          width="20"
          height="20"
        ><use :xlink:href="`#i_${icone}`" /></svg>
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
  icone?: string,
  cor?: string,
};

const $slots = defineSlots<Slots>();

const props = withDefaults(
  defineProps<Props>(),
  {
    titulo: undefined,
    icone: undefined,
    cor: 'blue',
  },
);

const temIcone = computed<boolean>(() => !!props.icone || !!$slots.icone);
</script>

<style lang="less" scoped>
.card-envelope-titulo__texto {
  color: v-bind(cor);
}
</style>
