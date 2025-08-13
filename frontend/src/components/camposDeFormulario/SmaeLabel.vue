<script setup lang="ts">
import { computed } from 'vue';
import buscarDadosDoYup from './helpers/buscarDadosDoYup';
import SmaeTooltip from '../SmaeTooltip/SmaeTooltip.vue';

type Slots = {
  default(props: { label: string }): void
  prepend(): void
  append(): void
  balaoInformativo: unknown
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
  balaoInformativo: {
    type: String,
    default: undefined,
  },
});

const slots = defineSlots<Slots>();

const caminhoNoSchema = computed(() => buscarDadosDoYup(props.schema, props.name));

const temInformacao = computed<boolean>(() => {
  if (props.balaoInformativo) {
    return true;
  }

  if (caminhoNoSchema.value.spec.meta?.balaoInformativo) {
    return true;
  }

  if (slots.balaoInformativo) {
    return true;
  }

  return false;
});
</script>

<template>
  <component
    :is="as"
    class="smae-label flex center"
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
        </template>

        <span
          v-if="required ||
            (
              caminhoNoSchema?.spec?.presence === 'required'
              && caminhoNoSchema?.type !== 'boolean'
            )"
          class="tvermelho"
        >&nbsp;*</span>

        {{ temInformacao ? '&nbsp;' : undefined }}

        <div class="relative flex center">
          <SmaeTooltip
            v-if="temInformacao"
            class="smae-label__tooltip"
            as="small"
            :texto="
              $props.balaoInformativo
                || caminhoNoSchema.spec.meta?.balaoInformativo
            "
          >
            <slot name="balaoInformativo" />
          </SmaeTooltip>
        </div>
      </template>
    </slot>
    <slot name="append" />
  </component>
</template>

<style lang="less" scoped>
.smae-label {
  :deep(.smae-tooltip) {
    position: static;
    min-width: 20px;
    height: 12px;
    transform: translateY(-50%);
  }
}

.smae-label__tooltip {
  width: fit-content;
  height: fit-content;
  position: fixed;
}
</style>
