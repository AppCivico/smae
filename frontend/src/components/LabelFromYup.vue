<script setup>
import { computed } from 'vue';

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
});

const caminhoNoSchema = computed(() => {
  if (!props.schema) {
    return null;
  }

  if (props.schema.fields[props.name]) {
    return props.schema.fields[props.name];
  }

  return props.name.split('.').reduce((acc, key, i, array) => (!array[i + 1]
    ? acc[key]
    : (
      acc?.[key]?.fields
      || acc?.[key]?.innerType?.fields
      || acc?.[key]
      || acc
    )
  ), (props.schema?.fields || {})) || null;
});
</script>
<template>
  <component
    :is="as"
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
        </template>&nbsp;<span
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
