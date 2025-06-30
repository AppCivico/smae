<script lang="ts" setup>
import { computed, ref } from 'vue';

type Slots = {
  default(): [unknown]
  botao(): [unknown]
};
defineSlots<Slots>();

type Props = {
  texto?: string
  icone?: string
  as?: string
};

withDefaults(defineProps<Props>(), {
  as: 'div',
  icone: 'i',
  texto: undefined,
});

const elemento = ref<HTMLElement>();
const elementoConteudo = ref<HTMLElement>();
const manterExibido = ref<boolean>(false);

const descricaoConteudo = computed<string>(() => elementoConteudo.value?.textContent || '');

function alternarAbertura() {
  manterExibido.value = !manterExibido.value;
}

const posicaoTooltip = computed(() => {
  if (!elemento.value) {
    return null;
  }

  const posicaoElemento = elemento.value?.getBoundingClientRect().left;

  const widths = {
    left: window.innerWidth * 0.40,
    center: window.innerWidth * 0.66,
  };

  if (posicaoElemento > widths.center) {
    return 'left';
  }

  if (posicaoElemento > widths.left) {
    return 'center';
  }

  return 'right';
});
</script>

<template>
  <component
    :is="$props.as"
    ref="elemento"
    :aria-description="descricaoConteudo"
    class="smae-tooltip-component"
    :class="{ 'smae-tooltip-component--fixado': manterExibido }"
    tabindex="0"
    @click="alternarAbertura"
  >
    <slot name="botao">
      <svg
        width="20"
        height="20"
      ><use :xlink:href="`#i_${$props.icone}`" /></svg>
    </slot>

    <div
      ref="elementoConteudo"
      class="smae-tooltip-component__content"
      :class="`smae-tooltip-component__content--${posicaoTooltip}`"
      role="tooltip"
    >
      <slot>{{ $props.texto }}</slot>
    </div>
  </component>
</template>

<style lang="less" scoped>
.smae-tooltip-component {
  display: inline-block;
  vertical-align: middle;
  color: @marrom;
  background-color: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  position: relative;

  > svg {
    display: inline-block;
  }

  &::after {
    content: "";
    position: absolute;
    min-width: 40px;
    min-height: 40px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

.smae-tooltip-component--fixado {
  color: #22222a;
}

.smae-tooltip-component__content {
  display: none;
  width: max-content;
  max-width: 25em;
  padding: 1em;
  color: white;
  background-color: @primary;
  border-radius: .5rem;
  font-size: 0.85rem;
  line-height: 1.4;
  text-align: center;
  text-transform: none;
  white-space: normal;
  pointer-events: none;
  position: fixed;
  z-index: 999;
  animation: fadeIn .5s;
  transform: translate(calc(-50% + 10px), calc(-100% - 24px - 0.5rem));

  &::before {
    content: "";
    position: absolute;
    left: calc(50% - 0.5rem);
    transform: rotate(-45deg);
    bottom: 1px;
    margin: 0 0 -0.5rem 0;
    border: .5rem solid transparent;
    border-bottom-color: @primary;
    border-left-color: @primary;
  }

  .smae-tooltip-component--fixado > &,
  :focus > &,
  :hover > &,
  :focus-within > & {
    display: block;
  }
}

.smae-tooltip-component__content--left {
  transform: translate(calc(-100% + 43px), calc(-100% - 24px - 0.5rem));

  &::before {
    left: calc(100% - 40px);
  }
}

.smae-tooltip-component__content--right {
  transform: translate(calc(-10% + 6px), calc(-100% - 24px - 0.5rem));

  &::before {
    left: 27px;
  }
}

</style>
