<script setup lang="ts">
import { computed } from 'vue';
import buscarDadosDoYup from './helpers/buscarDadosDoYup';

type Slots = {
  default(props: { label: string }): void
  prepend(): void
  append(): void
  informacao: unknown
};

const props = defineProps({
  as: {
    type: String,
    default: 'label',
    validator(value) {
      return ['label', 'legend', 'span'].includes(value);
    },
  },
  name: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  schema: {
    type: Object,
    default: () => null,
  },
  classeLabel: {
    type: Boolean,
    default: true,
  },
  informacao: {
    type: String,
    default: undefined,
  },
});

const slots = defineSlots<Slots>();

const caminhoNoSchema = computed(() => buscarDadosDoYup(props.schema, props.name));

const temInformacao = computed<boolean>(() => {
  if (props.informacao) {
    return true;
  }

  if (caminhoNoSchema.value.spec.meta?.informacao) {
    return true;
  }

  if (slots.informacao) {
    return true;
  }

  return false;
});
</script>

<template>
  <component
    :is="as"
    class="smae-label"
    :class="{ label: classeLabel && as !== 'legend' }"
    :for="as !== 'label'
      ? undefined
      : name || $attrs.for || null"
  >
    <slot name="prepend" />

    <slot :label="caminhoNoSchema?.spec?.label || name">
      <pre
        v-if="!caminhoNoSchema"
        v-ScrollLockDebug
      >
        Etiqueta não encontrada para `{{ name }}`
      </pre>

      <template v-else>
        <template v-if="schema">
          {{ caminhoNoSchema?.spec?.label || `Campo: ${name}` }}
        </template>&nbsp;

        <small
          v-if="temInformacao"
          class="tipinfo"
        >
          <svg
            width="20"
            height="20"
          ><use xlink:href="#i_i" /></svg>

          <div>
            <slot name="informacao">
              {{ $props.informacao || caminhoNoSchema.spec.meta?.informacao }}
            </slot>
          </div>
          &nbsp;
        </small>

        <span
          v-if="required ||
            (
              caminhoNoSchema?.spec?.presence === 'required'
              && caminhoNoSchema?.type !== 'boolean'
            )"
          class="tvermelho"
        >*</span>
      </template>
    </slot>
    <slot name="append" />
  </component>
</template>

<style lang="less" scoped>
.smae-label-informativo {

}
</style>
