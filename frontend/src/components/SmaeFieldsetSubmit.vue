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
  >
    <slot>
      <button
        class="btn big"
        type="submit"
        :aria-disabled="$props.erros && Object.keys($props.erros)?.length"
        :aria-busy="$props.estaCarregando"
      >
        Salvar
      </button>
    </slot>
  </component>
</template>

<style lang="less" scoped>
.smae-fieldset-submit {
  &::before, &::after {
    flex-grow: 1;
    content: '';
    height: 1.5px;
    background-color: @c300;
  }
}
</style>
