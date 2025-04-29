<script lang="ts" setup>
import { computed, ref } from 'vue';

const TOOLTIP_ID = 'smae-tooltip-button';
const TOOLTIP_TEXT_ID = 'smae-tooltip-text';

type Slots = {
  default(): void
  botao(): void
};

type Props = {
  texto?: string
  icone?: string
};

defineSlots<Slots>();
withDefaults(defineProps<Props>(), {
  icone: 'i',
  texto: '-texto-aqui-',
});

const exibicaoTooltip = ref<boolean>(false);
const manterExibido = ref<boolean>(false);

const statusTooltip = computed<boolean>(() => {
  if (manterExibido.value) {
    return false;
  }

  return !exibicaoTooltip.value;
});

function esconderTooltip() {
  exibicaoTooltip.value = false;
}

function exibirTooltip() {
  exibicaoTooltip.value = true;
}

function trocarManterAberto() {
  manterExibido.value = !manterExibido.value;
}

</script>

<template>
  <button
    :id="TOOLTIP_ID"
    :aria-describedby="TOOLTIP_TEXT_ID"
    :class="['smae-tooltip', { 'smae-tooltip--fixado': manterExibido }]"
    @mouseenter="exibirTooltip"
    @focus="exibirTooltip"
    @mouseleave="esconderTooltip"
    @blur="esconderTooltip"
    @click="trocarManterAberto"
  >
    <slot name="botao">
      <svg
        width="20"
        height="20"
      ><use :xlink:href="`#i_${$props.icone}`" /></svg>
    </slot>

    <div
      :id="TOOLTIP_TEXT_ID"
      class="smae-tooltip__content"
      role="tooltip"
      :hidden="statusTooltip"
    >
      <slot>{{ $props.texto }}</slot>
    </div>
  </button>
</template>

<style lang="less" scoped>
.smae-tooltip {
  margin-left: 4rem;
}

.smae-tooltip {
  display: inline-block;
  vertical-align: middle;
  color: @marrom;
  background-color: transparent;
  border: none;
  padding: 0;
  cursor: pointer;

  > svg {
    display: inline-block;
  }
}

.smae-tooltip--fixado {
  color: #22222a
}

.smae-tooltip__content {
  width: max-content;
  max-width: 200px;
  padding: 1rem;
  color: white;
  background-color: @primary;
  border-radius: .5rem;
  line-height: 1.4;
  text-align: center;
  text-transform: none;
  white-space: normal;
  pointer-events: none;
  position: fixed;
  z-index: 999;
  animation: fadeIn .5s;
  transform: translate(calc(-50% + 10px), calc(-100% - 24px - 0.5rem));

  &:before {
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

}
</style>
