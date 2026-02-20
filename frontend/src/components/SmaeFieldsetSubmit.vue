<script lang="ts" setup>
import isValidHtmlTag from '@/helpers/isValidHtmlTag';

defineOptions({ inheritAttrs: false });

defineProps({
  as: {
    type: String,
    default: 'fieldset',
    validator: (val: string) => isValidHtmlTag(val),
  },
  estaCarregando: {
    type: Boolean,
    default: false,
  },
  erros: {
    type: Object,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  removerLinhasDecoracao: {
    type: Boolean,
    default: false,
  },
  rotulo: {
    type: String,
    default: 'Salvar',
  },
});
</script>

<template>
  <FormErrorsList
    v-if="$props.erros"
    :errors="$props.erros"
    class="mb1"
  />

  <component
    v-bind="$attrs"
    :is="as"
    class="smae-fieldset-submit flex center g2"
    :class="{ 'smae-fieldset-submit--remover-linhas-decoracao': $props.removerLinhasDecoracao }"
  >
    <slot>
      <button
        class="btn big"
        type="submit"
        :aria-disabled="$props.disabled || ($props.erros && !!Object.keys($props.erros).length)"
        :aria-busy="$props.estaCarregando"
        :disabled="$props.disabled"
      >
        {{ $props.rotulo }}
      </button>
    </slot>
  </component>
</template>

<style lang="less" scoped>
.smae-fieldset-submit {
  display: flex;
  justify-content: center;

  &::before, &::after {
    flex-grow: 1;
    content: '';
    height: 1.5px;
    background-color: @c100;
  }
}

.smae-fieldset-submit--remover-linhas-decoracao {
  border-top: 0 !important;

  &::before, &::after {
    content: initial;
  }
}
</style>
